import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// ---- Auth ----

export function signup(email: string, password: string) {
  return api.post('/auth/signup', { email, password });
}

export function login(email: string, password: string) {
  return api.post('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function getMe() {
  return api.get('/auth/me');
}

// ---- Ingredients ----

export function getIngredients() {
  return api.get('/ingredients');
}

export function createIngredient(data: { name: string; slug: string; states: string[] }) {
  return api.post('/ingredients', data);
}

export function updateIngredient(id: string, data: { name?: string; states?: string[] }) {
  return api.put(`/ingredients/${id}`, data);
}

export function deleteIngredient(id: string) {
  return api.delete(`/ingredients/${id}`);
}

// ---- Recipes ----

export function getRecipes() {
  return api.get('/recipes');
}

export function createRecipe(data: object) {
  return api.post('/recipes', data);
}

export function updateRecipe(id: string, data: object) {
  return api.put(`/recipes/${id}`, data);
}

export function deleteRecipe(id: string) {
  return api.delete(`/recipes/${id}`);
}

export function resolveRecipe(id: string) {
  return api.get(`/recipes/${id}/resolve`);
}

// ---- Import / Export ----

export function exportCollection() {
  return api.get('/export');
}

export function importCollection(data: object) {
  return api.post('/import', data);
}

export default api;
