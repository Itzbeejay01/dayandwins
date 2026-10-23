import { useEffect, useState } from 'react';
import '../pages/days-wins.css';

export default function BrandSplash() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (window.sessionStorage.getItem('days-wins-introduced')) {
            setVisible(false);
            return;
        }
        const timer = window.setTimeout(() => {
            window.sessionStorage.setItem('days-wins-introduced', '1');
            setVisible(false);
        }, 1900);
        return () => window.clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return <div className="dw-splash" role="status" aria-label="Opening Days and Wins">
        <div className="dw-intro-art"><img src="/brand/journal.svg" alt="" /></div>
        <h1 className="dw-intro-name">Days <span>&</span> Wins</h1>
        <p>Every little win matters. <span>✦</span></p>
        <div className="dw-intro-line" aria-hidden="true" />
    </div>;
}
