import type {Metadata} from 'next';
import LightLanding from '@/components/landing/LightLanding';
export const metadata:Metadata={title:'Good judgment. Built in the mess. | PMForge',description:'Practice product interviews, work through real-world simulations, and build a portfolio of decisions you can defend.',alternates:{canonical:'/'}};
export default function HomePage(){return <LightLanding/>}
