import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchTodosRequest,
  fetchTodosSuccess,
  fetchTodosFailure,
  createTodoRequest,
  createTodoSuccess,
  createTodoFailure,
  updateTodoRequest,
  updateTodoSuccess,
  updateTodoFailure,
  deleteTodoRequest,
  deleteTodoSuccess,
  deleteTodoFailure,
  toggleTodoRequest,
  toggleTodoSuccess,
  toggleTodoFailure,
} from './todosSlice';
import { Todo, CreateTodoPayload, UpdateTodoPayload } from './types';

const API_URL = '/api/todos';

// API functions
async function fetchTodosApi(): Promise<Todo[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json();
}

async function createTodoApi(payload: CreateTodoPayload): Promise<Todo> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create todo');
  return response.json();
}

async function updateTodoApi(payload: UpdateTodoPayload): Promise<Todo> {
  const { id, ...data } = payload;
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update todo');
  return response.json();
}

async function deleteTodoApi(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete todo');
}

async function toggleTodoApi(id: number): Promise<Todo> {
  const response = await fetch(`${API_URL}/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!response.ok) throw new Error('Failed to toggle todo');
  return response.json();
}

// Saga workers
function* fetchTodosSaga() {
  try {
    const todos: Todo[] = yield call(fetchTodosApi);
    yield put(fetchTodosSuccess(todos));
  } catch (error) {
    yield put(fetchTodosFailure((error as Error).message));
  }
}

function* createTodoSaga(action: PayloadAction<CreateTodoPayload>) {
  try {
    const todo: Todo = yield call(createTodoApi, action.payload);
    yield put(createTodoSuccess(todo));
  } catch (error) {
    yield put(createTodoFailure((error as Error).message));
  }
}

function* updateTodoSaga(action: PayloadAction<UpdateTodoPayload>) {
  try {
    const todo: Todo = yield call(updateTodoApi, action.payload);
    yield put(updateTodoSuccess(todo));
  } catch (error) {
    yield put(updateTodoFailure((error as Error).message));
  }
}

function* deleteTodoSaga(action: PayloadAction<number>) {
  try {
    yield call(deleteTodoApi, action.payload);
    yield put(deleteTodoSuccess(action.payload));
  } catch (error) {
    yield put(deleteTodoFailure((error as Error).message));
  }
}

function* toggleTodoSaga(action: PayloadAction<number>) {
  try {
    const todo: Todo = yield call(toggleTodoApi, action.payload);
    yield put(toggleTodoSuccess(todo));
  } catch (error) {
    yield put(toggleTodoFailure((error as Error).message));
  }
}

// Saga watcher
export function* todosSaga() {
  yield takeLatest(fetchTodosRequest.type, fetchTodosSaga);
  yield takeLatest(createTodoRequest.type, createTodoSaga);
  yield takeLatest(updateTodoRequest.type, updateTodoSaga);
  yield takeLatest(deleteTodoRequest.type, deleteTodoSaga);
  yield takeLatest(toggleTodoRequest.type, toggleTodoSaga);
}
