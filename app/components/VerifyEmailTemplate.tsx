import * as React from 'react';

//

interface EmailTemplateProps {
  firstName: string;
}

//

export function VerifyEmailTemplate({ link }: EmailTemplateProps) {
    return (
        <div>
            <h1>Click the link to verify: {link}</h1>
        </div>
    );
}

