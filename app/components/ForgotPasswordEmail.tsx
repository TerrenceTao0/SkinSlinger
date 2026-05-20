import * as React from 'react';

//

interface EmailTemplateProps {
  link: string;
}

//

export function ForgotPasswordEmail({ link }: EmailTemplateProps) {
    return (
        <div>
            <a href={link}>
                Click to reset password
            </a>
        </div>
    );
}

