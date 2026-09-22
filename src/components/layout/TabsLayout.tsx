import { Outlet } from 'react-router-dom';
import { Ambient } from './Ambient';
import { Navbar } from './Navbar';

export function TabsLayout() {
  return (
    <div className="app-shell">
      <Ambient />
      <Navbar />
      <div className="grow">
        <Outlet />
      </div>
    </div>
  );
}
