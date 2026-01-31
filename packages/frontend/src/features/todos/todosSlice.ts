import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, TodosState, CreateTodoPayload, UpdateTodoPayload } from './types';

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // Fetch todos
    fetchTodosRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTodosSuccess: (state, action: PayloadAction<Todo[]>) => {
      state.loading = false;
      state.items = action.payload;
    },
    fetchTodosFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create todo
    createTodoRequest: (state, _action: PayloadAction<CreateTodoPayload>) => {
      state.loading = true;
      state.error = null;
    },
    createTodoSuccess: (state, action: PayloadAction<Todo>) => {
      state.loading = false;
      state.items.unshift(action.payload);
    },
    createTodoFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update todo
    updateTodoRequest: (state, _action: PayloadAction<UpdateTodoPayload>) => {
      state.loading = true;
      state.error = null;
    },
    updateTodoSuccess: (state, action: PayloadAction<Todo>) => {
      state.loading = false;
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateTodoFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete todo
    deleteTodoRequest: (state, _action: PayloadAction<number>) => {
      state.loading = true;
      state.error = null;
    },
    deleteTodoSuccess: (state, action: PayloadAction<number>) => {
      state.loading = false;
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    deleteTodoFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Toggle todo
    toggleTodoRequest: (state, _action: PayloadAction<number>) => {
      state.error = null;
    },
    toggleTodoSuccess: (state, action: PayloadAction<Todo>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    toggleTodoFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  clearError,
} = todosSlice.actions;

export default todosSlice.reducer;
