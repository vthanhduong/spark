import React, { useState, useEffect } from 'react'

type Props = {
    contentOrUrl: string;
}

export const Image = (props: Props) => {
    const [url, setUrl] = useState<string[]>('');
    const extract = (content: string) => {
        const urlRegex = /https?:\/\/[^\s"'<>)\]]+/;
        const match = content.match(urlRegex);
        return match ? match[0] : null;
    }
    useEffect(() => {
        setUrl(extract(props.contentOrUrl));
    }, [])
    
    return (
        <>
            {   
                url && (
                    <div className="w-full flex flex-col items-center justify-center">
                        <img className="w-[600px] border rounded-xl shadow-xl border-gray-500" src={url}></img>
                    </div>
                )
            }
        </>
    )
}