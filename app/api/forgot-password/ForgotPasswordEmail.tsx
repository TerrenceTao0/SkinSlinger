import * as React from 'react';

//

interface EmailTemplateProps {
    link: string;
}

//

export function ForgotPasswordEmail({ link }: EmailTemplateProps) {
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
                        Reset your password
                    </h2>
                    <p style={{ margin: '0 0 28px', color: '#aaaaaa', fontSize: '15px', lineHeight: '1.6' }}>
                        We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
                    </p>

                    <a
                        href={link}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#3d9cbe',
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '12px 28px',
                            borderRadius: '4px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                        }}
                    >
                        Reset Password
                    </a>

                    <p style={{ margin: '28px 0 0', color: '#666666', fontSize: '13px' }}>
                        If you didn't request a password reset, you can ignore this email.
                    </p>
                </div>

            </div>
        </div>
    );
}
