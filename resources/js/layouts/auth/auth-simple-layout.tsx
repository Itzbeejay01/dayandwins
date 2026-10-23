import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import '../../pages/days-wins.css';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return <div className="dw-auth-shell">
        <div className="dw-auth-content">
            <Link href="/" className="dw-auth-brand"><span className="dw-logo-book">✦</span><span>Days <i>&</i> Wins</span></Link>
            <div className="dw-auth-illustration" aria-hidden="true"><div className="dw-splash-book">✦</div></div>
            <div className="dw-auth-head"><h1>Your story <em>matters.</em></h1><p>Every little win matters.</p></div>
            <div className="dw-auth-form">{children}</div>
        </div>
    </div>;
}
