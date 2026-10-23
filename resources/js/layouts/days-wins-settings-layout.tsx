import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, LockKeyhole, Palette, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import '@/pages/days-wins.css';

const links = [
    { href: '/settings/profile', label: 'Profile', icon: UserRound },
    { href: '/settings/security', label: 'Security', icon: LockKeyhole },
    { href: '/settings/appearance', label: 'Appearance', icon: Palette },
];

export default function MobileSettingsLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { url } = usePage();

    return (
        <div className="dw-mobile-settings">
            <header className="dw-settings-header">
                <Link href="/dashboard" aria-label="Back to your journal">
                    <ArrowLeft size={18} />
                </Link>
                <strong>
                    Days <em>&</em> Wins
                </strong>
                <div aria-hidden="true" />
            </header>
            <div className="dw-settings-container">
                <div className="dw-settings-title">
                    <small>YOUR SPACE</small>
                    <h1>Settings</h1>
                    <p>A little space for the things that matter.</p>
                </div>
                <nav
                    className="dw-settings-tabs"
                    aria-label="Settings sections"
                >
                    {links.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                url.startsWith(item.href) ? 'active' : ''
                            }
                        >
                            <item.icon size={16} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="dw-settings-body">{children}</div>
            </div>
        </div>
    );
}
