export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodosState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
}

export interface UpdateTodoPayload {
  id: number;
  title?: string;
  description?: string;
  completed?: boolean;
}
