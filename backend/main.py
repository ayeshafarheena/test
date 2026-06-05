from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3, uuid, json, os
from typing import Optional
from datetime import datetime

app = FastAPI(title="Movies API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

S3_UPLOAD_BUCKET = os.getenv("S3_UPLOAD_BUCKET", "movies-app-upload-raw-videos")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN", "")  # e.g. d1234abcd.cloudfront.net
AWS_REGION        = os.getenv("AWS_REGION", "us-east-1")
DB_FILE           = "/app/movies_db.json"

s3 = boto3.client("s3", region_name=AWS_REGION)

CATEGORIES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Documentary", "Thriller"]


# ── Helpers ──────────────────────────────────────────────────

def load_db():
    if not os.path.exists(DB_FILE):
        return {"movies": []}
    with open(DB_FILE) as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def cloudfront_url(s3_key: str) -> str:
    if CLOUDFRONT_DOMAIN:
        return f"https://{CLOUDFRONT_DOMAIN}/{s3_key}"
    return f"https://{S3_UPLOAD_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"


# ── Routes ───────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "service": "Movies API"}


@app.get("/categories")
def get_categories():
    return {"categories": CATEGORIES}


@app.get("/movies")
def list_movies(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, le=50),
):
    db = load_db()
    movies = db["movies"]

    if search:
        q = search.lower()
        movies = [m for m in movies if q in m["title"].lower() or q in m.get("description", "").lower()]

    if category:
        movies = [m for m in movies if m.get("category") == category]

    movies = sorted(movies, key=lambda m: m["created_at"], reverse=True)
    total  = len(movies)
    start  = (page - 1) * limit
    paged  = movies[start : start + limit]

    return {"total": total, "page": page, "limit": limit, "movies": paged}


@app.get("/movies/{movie_id}")
def get_movie(movie_id: str):
    db = load_db()
    movie = next((m for m in db["movies"] if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@app.post("/movies/upload")
async def upload_movie(
    title: str       = Form(...),
    description: str = Form(""),
    category: str    = Form("Action"),
    video: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
):
    movie_id    = str(uuid.uuid4())
    video_ext   = video.filename.split(".")[-1]
    video_key   = f"videos/{movie_id}.{video_ext}"

    # Upload video to S3
    s3.upload_fileobj(
        video.file,
        S3_UPLOAD_BUCKET,
        video_key,
        ExtraArgs={"ContentType": video.content_type or "video/mp4"},
    )

    # Upload thumbnail if provided
    thumb_url = None
    if thumbnail and thumbnail.filename:
        thumb_ext = thumbnail.filename.split(".")[-1]
        thumb_key = f"thumbnails/{movie_id}.{thumb_ext}"
        s3.upload_fileobj(
            thumbnail.file,
            S3_UPLOAD_BUCKET,
            thumb_key,
            ExtraArgs={"ContentType": thumbnail.content_type or "image/jpeg"},
        )
        thumb_url = cloudfront_url(thumb_key)

    video_url = cloudfront_url(video_key)

    movie = {
        "id":          movie_id,
        "title":       title,
        "description": description,
        "category":    category,
        "video_url":   video_url,
        "thumbnail":   thumb_url,
        "rating":      0.0,
        "rating_count": 0,
        "views":       0,
        "created_at":  datetime.utcnow().isoformat(),
    }

    db = load_db()
    db["movies"].append(movie)
    save_db(db)

    return {"message": "Movie uploaded successfully", "movie": movie}


@app.post("/movies/{movie_id}/rate")
def rate_movie(movie_id: str, rating: float = Form(...)):
    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    db = load_db()
    movie = next((m for m in db["movies"] if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    count         = movie.get("rating_count", 0)
    current       = movie.get("rating", 0.0)
    new_rating    = round((current * count + rating) / (count + 1), 1)
    movie["rating"]       = new_rating
    movie["rating_count"] = count + 1

    save_db(db)
    return {"rating": new_rating, "rating_count": movie["rating_count"]}


@app.post("/movies/{movie_id}/view")
def increment_view(movie_id: str):
    db = load_db()
    movie = next((m for m in db["movies"] if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie["views"] = movie.get("views", 0) + 1
    save_db(db)
    return {"views": movie["views"]}


@app.delete("/movies/{movie_id}")
def delete_movie(movie_id: str):
    db = load_db()
    movie = next((m for m in db["movies"] if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # Delete from S3
    try:
        video_key = movie["video_url"].split(".net/")[-1]
        s3.delete_object(Bucket=S3_UPLOAD_BUCKET, Key=video_key)
    except Exception:
        pass

    db["movies"] = [m for m in db["movies"] if m["id"] != movie_id]
    save_db(db)
    return {"message": "Movie deleted"}


@app.get("/presigned-upload")
def presigned_upload(filename: str, content_type: str = "video/mp4"):
    key = f"videos/{uuid.uuid4()}.{filename.split('.')[-1]}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_UPLOAD_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=3600,
    )
    return {"url": url, "key": key, "cdn_url": cloudfront_url(key)}
