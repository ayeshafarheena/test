import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

export const getMovies  = (params) => api.get('/movies', { params });
export const getMovie   = (id) => api.get(`/movies/${id}`);
export const uploadMovie = (formData, onProgress) =>
  api.post('/movies/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
export const rateMovie  = (id, rating) => {
  const fd = new FormData(); fd.append('rating', rating);
  return api.post(`/movies/${id}/rate`, fd);
};
export const viewMovie  = (id) => api.post(`/movies/${id}/view`);
export const deleteMovie = (id) => api.delete(`/movies/${id}`);
export const getCategories = () => api.get('/categories');

export default api;
