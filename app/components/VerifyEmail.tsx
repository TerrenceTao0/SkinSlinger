import * as React from 'react';

//

interface EmailTemplateProps {
  link: string;
}

//

export function VerifyEmail({ link }: EmailTemplateProps) {
    return (
        <div>
            <a href={link}>
                Click to verify email and login
            </a>
        </div>
    );
}

