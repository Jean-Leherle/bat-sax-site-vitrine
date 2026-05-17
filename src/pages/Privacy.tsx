import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col animate-fade-in px-4 pb-12">
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-sm btn-outline w-fit cursor-none mb-8"
      >
        ◀ Retour
      </button>

      <h1 className="neon text-3xl md:text-4xl mb-2">Politique de Confidentialité</h1>
      <p className="text-sm opacity-70 mb-10">Dernière mise à jour : Mai 2026</p>

      <div className="flex flex-col gap-6">
        
        {/* SECTION 1 : Google OAuth */}
        <div className="bg-[#0a0a0a] border border-primary/50 p-6 md:p-8 rounded-xl shadow-[0_0_15px_rgba(0,255,204,0.05)]">
          <h2 className="text-xl font-bold text-primary mb-4 font-['Press_Start_2P'] text-[12px] tracking-widest leading-loose">
            1. AUTHENTIFICATION GOOGLE & DISCORD
          </h2>
          <p className="opacity-90 text-sm leading-relaxed mb-4">
            Pour vous permettre de participer à la communauté (proposer des morceaux et voter), l'application BatSax utilise les services d'authentification sécurisés de Google et Discord.
          </p>
          <p className="opacity-90 text-sm leading-relaxed">
            Lorsque vous vous connectez, nous recueillons <strong>uniquement</strong> les informations strictement nécessaires à la création de votre profil :
          </p>
          <ul className="list-disc list-inside mt-3 opacity-90 text-sm flex flex-col gap-2 ml-2">
            <li>Votre adresse e-mail</li>
            <li>Votre nom ou pseudo public</li>
            <li>Votre photo de profil (Avatar)</li>
          </ul>
        </div>

        {/* SECTION 2 : Utilisation des données */}
        <div className="bg-[#050505] border border-gray-800 p-6 md:p-8 rounded-xl hover:border-gray-600 transition-colors">
          <h2 className="text-xl font-bold text-gray-300 mb-4 font-['Press_Start_2P'] text-[12px] tracking-widest leading-loose">
            2. UTILISATION DE VOS DONNÉES
          </h2>
          <p className="opacity-90 text-sm leading-relaxed">
            Les informations recueillies servent <strong>exclusivement</strong> au fonctionnement interne du site BatSax, à savoir :
          </p>
          <ul className="list-disc list-inside mt-3 opacity-90 text-sm flex flex-col gap-2 ml-2">
            <li>Vous identifier en tant qu'auteur d'une proposition de morceau.</li>
            <li>Comptabiliser vos votes de manière unique pour éviter la triche.</li>
            <li>Maintenir votre session active de manière sécurisée.</li>
          </ul>
        </div>

        {/* SECTION 3 : Protection et Revente */}
        <div className="bg-[#050505] border border-gray-800 p-6 md:p-8 rounded-xl hover:border-gray-600 transition-colors">
          <h2 className="text-xl font-bold text-gray-300 mb-4 font-['Press_Start_2P'] text-[12px] tracking-widest leading-loose">
            3. PROTECTION ET PARTAGE
          </h2>
          <p className="opacity-90 text-sm leading-relaxed border-l-2 border-primary pl-4 bg-primary/5 py-3 rounded-r-lg">
            <strong>Aucune de vos données personnelles n'est revendue à des tiers, cédée à des partenaires ou utilisée à des fins de ciblage publicitaire.</strong>
          </p>
          <p className="opacity-90 text-sm leading-relaxed mt-4">
            L'association BatSax n'enverra jamais de newsletters non sollicitées ou de spams sur votre adresse e-mail.
          </p>
        </div>

        {/* SECTION 4 : Droits et Suppression */}
        <div className="bg-[#050505] border border-gray-800 p-6 md:p-8 rounded-xl hover:border-gray-600 transition-colors">
          <h2 className="text-xl font-bold text-gray-300 mb-4 font-['Press_Start_2P'] text-[12px] tracking-widest leading-loose">
            4. SUPPRESSION DE VOS DONNÉES
          </h2>
          <p className="opacity-90 text-sm leading-relaxed">
            Conformément au RGPD, vous disposez d'un droit d'accès, de modification et de suppression totale de vos données.
          </p>
          <p className="opacity-90 text-sm leading-relaxed mt-3">
            Pour demander la suppression immédiate de votre compte, de vos propositions et de l'historique de vos votes, il vous suffit de nous envoyer un e-mail à :
          </p>
          <a 
            href="mailto:contact@batsax.fr" 
            className="inline-block mt-4 text-primary hover:text-white font-bold tracking-wider cursor-none transition-colors border-b border-primary/50 hover:border-white"
          >
            contact@batsax.fr
          </a>
        </div>

      </div>
    </div>
  );
}