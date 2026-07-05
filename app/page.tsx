export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-center tracking-tight">
        Automatiza tu éxito con <span className="text-blue-500">IA</span>
      </h1>
      <p className="text-xl text-slate-400 mb-10 max-w-2xl text-center">
        Transformamos procesos complejos en flujos automáticos. ¿Listo para escalar tu agencia?
      </p>
      <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-slate-200 transition-all transform hover:scale-105">
        Solicitar Auditoría Gratuita
      </button>
    </main>
  );
}