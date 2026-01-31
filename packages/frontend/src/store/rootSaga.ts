import { all, fork } from 'redux-saga/effects';
import { todosSaga } from '../features/todos/todosSaga';

export function* rootSaga() {
  yield all([fork(todosSaga)]);
}
