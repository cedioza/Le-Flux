import { Play, Link as LinkIcon, Menu } from 'lucide-react';

export const Header = () => {
    return (
        <header className="h-16 bg-mistral-bg border-b border-mistral-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {/* Abstract Flow Icon */}
                    <div className="w-8 h-8 rounded-full border-2 border-mistral-yellow flex items-center justify-center">
                        <div className="w-4 h-4 bg-mistral-yellow rounded-full" />
                    </div>
                    <span className="text-mistral-yellow font-bold text-xl tracking-wide">Le Flux</span>
                </div>

                <nav className="hidden md:flex items-center gap-6 ml-8">
                    {['Canvas', 'Nodos', 'Ejecuciones', 'Export'].map((tab, i) => (
                        <button key={tab} className={`text-sm font-medium transition-colors ${i === 0 ? 'text-white border-b-2 border-mistral-yellow py-5' : 'text-mistral-muted hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <input
                        type="password"
                        placeholder="API Key..."
                        className="bg-mistral-panel border border-mistral-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-mistral-yellow w-48"
                    />
                </div>

                <button className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-mistral-panel text-mistral-muted hover:text-white transition-colors">
                    <LinkIcon className="w-5 h-5" />
                </button>

                <button className="bg-mistral-yellow hover:bg-mistral-hover text-black font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-transform active:scale-95 shadow-[0_0_15px_rgba(252,211,77,0.3)]">
                    <Play className="w-4 h-4 fill-current" />
                    Play
                </button>

                <button className="md:hidden text-mistral-muted ml-2">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
