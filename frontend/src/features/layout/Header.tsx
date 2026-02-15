import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, ChevronDown, Sun, Moon } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    return (
        <header className="header">
            <div className="header__title">
                {/* Placeholder for dynamic title or breadcrumb */}
                <span className="d-md-none fw-bold">bepay</span>
            </div>

            {/* Desktop Actions */}
            <div className="header__actions d-none d-md-flex">
                <button
                    className="header__theme-toggle"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="header__divider" />
                {user && (
                    <div
                        className="header__profile"
                        onMouseEnter={() => setIsMenuOpen(true)}
                        onMouseLeave={() => setIsMenuOpen(false)}
                    >
                        <div className="header__avatar">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="header__username">
                            {user.name}
                        </span>
                        <ChevronDown size={16} className="header__chevron" />

                        {isMenuOpen && (
                            <div className="header__menu animate-fade-in">
                                <div className="header__menu-item" onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}>
                                    <UserIcon size={16} />
                                    <span>Profile</span>
                                </div>
                                <div className="header__menu-divider" />
                                <div className="header__menu-item text-danger" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Actions Toggle */}
            <div className="header__mobile-toggle d-md-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <div className="header__avatar header__mobile-toggle-btn">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu__header">
                            <div className="header__profile">
                                <div className="header__avatar">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="mobile-menu__user-info">
                                    <span className="header__username">{user?.name}</span>
                                    <span className="text-muted text-xs">{user?.email}</span>
                                </div>
                            </div>
                            <button className="btn-close" onClick={() => setMobileMenuOpen(false)}>×</button>
                        </div>

                        <div className="mobile-menu__content">
                            <div className="mobile-menu__section">
                                <div className="header__menu-item" onClick={toggleTheme}>
                                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </div>
                            </div>

                            <div className="mobile-menu__divider" />

                            <div className="mobile-menu__section">
                                <div className="header__menu-item" onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}>
                                    <UserIcon size={16} />
                                    <span>My Profile</span>
                                </div>
                            </div>

                            <div className="mobile-menu__divider" />

                            <div className="mobile-menu__section">
                                <div className="header__menu-item text-danger" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
