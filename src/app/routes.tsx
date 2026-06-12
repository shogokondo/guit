import { createBrowserRouter } from 'react-router';
import Home from './pages/Home';
import SheetDetail from './pages/SheetDetail';
import Edit from './pages/Edit';
import Play from './pages/Play';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/sheet/:id',
    Component: SheetDetail,
  },
  {
    path: '/edit/:id',
    Component: Edit,
  },
  {
    path: '/play/:id',
    Component: Play,
  },
]);
