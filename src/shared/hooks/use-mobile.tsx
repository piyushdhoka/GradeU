import * as React from "react"

export function useMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

    React.useEffect(() => {
        const mql = window.matchMedia("(max-width: 768px)")
        const onChange = () => {
            setIsMobile(window.innerWidth < 768)
        }
        mql.addEventListener("change", onChange)
        setIsMobile(window.innerWidth < 768)
        return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
}
