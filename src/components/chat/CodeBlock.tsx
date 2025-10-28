
'use client';

import { CopyButton } from './CopyButton';

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
    children?: React.ReactNode;
}

export function CodeBlock({ children, ...props }: CodeBlockProps) {
    if (!children || typeof children !== 'object') {
        return <pre {...props}>{children}</pre>;
    }
    
    const child = 'props' in children ? children.props : {};
    const code = child.children;

    return (
        <div className="relative group">
            <CopyButton code={code} />
            <pre {...props} className="bg-background/80 p-3 rounded-md border border-input text-sm !pl-4 !py-3">
                {children}
            </pre>
        </div>
    );
}
