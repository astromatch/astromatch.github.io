import { NavLink } from 'react-router-dom';

export function ProfileTabs(){
  return <nav className="profile-tabs" aria-label="Your profile">
    <NavLink to="/profile" end>Profile</NavLink>
    <NavLink to="/profile/chart">Chart</NavLink>
    <NavLink to="/settings">Settings</NavLink>
  </nav>;
}
