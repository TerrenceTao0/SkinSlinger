import * as React from 'react';

//

interface TwoFactorEmailProps {
    code: string;
}

//

export function TwoFactorEmail({ code }: TwoFactorEmailProps) {
    return (
        <div style={{ backgroundColor: '#1f1f1f', padding: '40px 0', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#2c2c2c', borderRadius: '6px', overflow: 'hidden' }}>

                <div style={{ backgroundColor: '#363636', padding: '24px 32px' }}>
                    <h1 style={{ margin: 0, color: '#3d9cbe', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        SkinSlinger
                    </h1>
                </div>

                <div style={{ padding: '36px 32px' }}>
                    <h2 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
                        Your login code
                    </h2>
                    <p style={{ margin: '0 0 28px', color: '#aaaaaa', fontSize: '15px', lineHeight: '1.6' }}>
                        Enter this code to complete your login. It expires in 10 minutes.
                    </p>

                    <div style={{
                        backgroundColor: '#363636',
                        borderRadius: '4px',
                        padding: '18px 28px',
                        display: 'inline-block',
                        letterSpacing: '8px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                    }}>
                        {code}
                    </div>

                    <p style={{ margin: '28px 0 0', color: '#666666', fontSize: '13px' }}>
                        If you didn't try to log in, you can ignore this email.
                    </p>
                </div>

            </div>
        </div>
    );
}
