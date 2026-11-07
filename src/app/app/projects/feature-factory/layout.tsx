import type {Metadata} from 'next';
export const metadata:Metadata={title:'The Feature Factory — PMForge',description:'A living PM desktop. Fifteen working days, one team, and the real cost of shipping every Friday.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return children;}
