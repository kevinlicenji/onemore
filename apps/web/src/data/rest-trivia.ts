export interface RestTriviaItem {
  it: string;
  en: string;
}

/** Static micro-facts shown during rest timers (no network required). */
export const REST_TRIVIA_ITEMS: RestTriviaItem[] = [
  {
    it: 'Mantenere i muscoli in tensione per più di 30 secondi favorisce l’ipertrofia.',
    en: 'Keeping muscles under tension for 30+ seconds supports hypertrophy.',
  },
  {
    it: 'Idratarsi durante il recupero può migliorare la forza della serie successiva.',
    en: 'Staying hydrated during rest can improve your next set’s strength.',
  },
  {
    it: 'Il sonno di qualità è quando il corpo costruisce più massa muscolare.',
    en: 'Quality sleep is when your body builds the most muscle mass.',
  },
  {
    it: 'La respirazione lenta durante il recupero aiuta a riportare la frequenza cardiaca a riposo.',
    en: 'Slow breathing during rest helps bring your heart rate back down.',
  },
  {
    it: 'Le proteine distribuite nel giorno supportano meglio il recupero rispetto a un solo pasto ricco.',
    en: 'Spreading protein through the day supports recovery better than one huge meal.',
  },
  {
    it: 'Un recupero troppo breve riduce il volume utile nelle serie successive.',
    en: 'Resting too little reduces useful volume on later sets.',
  },
  {
    it: 'La tecnica pulita sotto fatica protegge articolazioni e tendini nel lungo periodo.',
    en: 'Clean technique under fatigue protects joints and tendons long term.',
  },
  {
    it: 'Il riscaldamento specifico dell’esercizio riduce il rischio di infortuni acuti.',
    en: 'Exercise-specific warm-ups reduce acute injury risk.',
  },
  {
    it: 'La creatina monohidrato è tra i supplementi più studiati per forza e potenza.',
    en: 'Creatine monohydrate is among the most studied supplements for strength and power.',
  },
  {
    it: 'Il sovraccarico progressivo non richiede sempre più peso: anche più ripetizioni contano.',
    en: 'Progressive overload doesn’t always mean more weight—more reps count too.',
  },
  {
    it: 'I carboidrati prima dell’allenamento aiutano a sostenere serie ad alta intensità.',
    en: 'Carbs before training help sustain high-intensity sets.',
  },
  {
    it: 'Il dolore muscolare ritardato (DOMS) non è un indicatore affidabile di un buon workout.',
    en: 'Delayed muscle soreness (DOMS) isn’t a reliable sign of a good workout.',
  },
  {
    it: 'La mobilità attiva tra le serie mantiene il range di movimento senza spegnere i muscoli.',
    en: 'Active mobility between sets keeps range of motion without shutting muscles down.',
  },
  {
    it: 'Allenare fino al cedimento tecnico spesso basta senza arrivare al fallimento assoluto.',
    en: 'Training to technical failure is often enough without absolute failure.',
  },
  {
    it: 'La temperatura ambiente calda aumenta la percezione di fatica cardiovascolare.',
    en: 'Warm room temperature increases perceived cardiovascular fatigue.',
  },
  {
    it: 'Una presa stabile sul bilanciere migliora la trasmissione di forza dal corpo al carico.',
    en: 'A stable barbell grip improves force transfer from body to load.',
  },
  {
    it: 'Il tempo sotto tensione conta: serie controllate spesso battono serie sloppate più pesanti.',
    en: 'Time under tension matters—controlled sets often beat sloppy heavier ones.',
  },
  {
    it: 'La caffeina può migliorare la performance acuta, ma non sostituisce sonno e recupero.',
    en: 'Caffeine can boost acute performance but won’t replace sleep and recovery.',
  },
  {
    it: 'Il core attivo durante i multiarticolari protegge la colonna sotto carico.',
    en: 'An active core during compound lifts protects the spine under load.',
  },
  {
    it: 'Registrare i dati delle serie rende l’autoregolazione molto più oggettiva.',
    en: 'Logging set data makes autoregulation much more objective.',
  },
  {
    it: 'Il magnesio contribuisce alla funzione muscolare e nervosa nel recupero.',
    en: 'Magnesium supports muscle and nerve function during recovery.',
  },
  {
    it: 'Alternare intensità nelle settimane (deload) previene stagnazione e overreaching.',
    en: 'Alternating intensity weeks (deloads) prevents stagnation and overreaching.',
  },
  {
    it: 'La fase eccentrica controllata aumenta lo stimolo muscolare con meno carico.',
    en: 'Controlled eccentric phases increase muscle stimulus with less load.',
  },
  {
    it: 'Una colazione leggera 2–3 ore prima dell’allenamento evita cali di energia improvvisi.',
    en: 'A light meal 2–3 hours before training avoids sudden energy crashes.',
  },
  {
    it: 'La postura dei piedi influenza la stabilità negli squat e negli stacchi.',
    en: 'Foot positioning influences stability in squats and deadlifts.',
  },
  {
    it: 'Il volume settimanale totale conta più di un singolo allenamento eroico.',
    en: 'Total weekly volume matters more than one heroic session.',
  },
  {
    it: 'Stretching statico prolungato subito prima di una serie massimale può ridurre la potenza.',
    en: 'Long static stretching right before a max set can reduce power output.',
  },
  {
    it: 'La consistenza nel tempo batte la perfezione occasionale.',
    en: 'Consistency over time beats occasional perfection.',
  },
  {
    it: 'Il sodio in quantità adeguate supporta l’idratazione durante sessioni lunghe.',
    en: 'Adequate sodium supports hydration during long sessions.',
  },
  {
    it: 'Allenare un gruppo muscolare 2× a settimana è un buon punto di partenza per l’ipertrofia.',
    en: 'Training a muscle group 2× per week is a solid hypertrophy starting point.',
  },
  {
    it: 'La progressione troppo rapida del carico aumenta il rischio di tendiniti.',
    en: 'Ramping load too fast raises tendinopathy risk.',
  },
  {
    it: 'Il riscaldamento generale di 5–10 minuti migliora la circolazione prima del lavoro pesante.',
    en: 'A 5–10 minute general warm-up improves circulation before heavy work.',
  },
  {
    it: 'Le serie di avvicinamento (warm-up sets) preparano sistema nervoso e pattern motorio.',
    en: 'Warm-up sets prime the nervous system and movement pattern.',
  },
  {
    it: 'La varietà controllata degli stimoli previene adattamento e noia.',
    en: 'Controlled stimulus variety prevents adaptation plateaus and boredom.',
  },
  {
    it: 'Il recupero attivo leggero il giorno dopo può ridurre la rigidità muscolare.',
    en: 'Light active recovery the next day can reduce muscle stiffness.',
  },
  {
    it: 'La forza isometrica al rack può aiutare a superare punti deboli nel movimento.',
    en: 'Isometric work at the rack can help overcome weak points in a lift.',
  },
  {
    it: 'Un diario di allenamento rende visibili i trend che la memoria dimentica.',
    en: 'A training log reveals trends memory forgets.',
  },
  {
    it: 'La temperatura muscolare ottimale si raggiunge dopo le prime serie di lavoro.',
    en: 'Optimal muscle temperature is reached after the first working sets.',
  },
  {
    it: 'Il glucosio muscolare si ripristina tra le serie con recuperi adeguati.',
    en: 'Muscle glycogen replenishes between sets with adequate rest.',
  },
  {
    it: 'La pressione intra-addominale corretta stabilizza il torso nei carichi pesanti.',
    en: 'Proper intra-abdominal pressure stabilizes the torso under heavy loads.',
  },
  {
    it: 'Allenare in fascia oraria costante aiuta a costruire abitudine e sonno regolare.',
    en: 'Training at a consistent time helps build habit and regular sleep.',
  },
  {
    it: 'Il ferro nella dieta supporta il trasporto di ossigeno durante sforzi ripetuti.',
    en: 'Dietary iron supports oxygen transport during repeated efforts.',
  },
  {
    it: 'La fatica centrale (sistema nervoso) può limitare la performance prima dei muscoli.',
    en: 'Central fatigue (nervous system) can limit performance before muscles do.',
  },
  {
    it: 'Una pausa di 2–3 minuti tra serie pesanti favorisce il recupero del fosfocreatina.',
    en: '2–3 minute rests between heavy sets favor phosphocreatine recovery.',
  },
  {
    it: 'La temperatura dell’acqua durante l’idratazione non cambia l’assorbimento in modo significativo.',
    en: 'Water temperature doesn’t significantly change hydration absorption.',
  },
  {
    it: 'Il focus visivo su un punto fisso può migliorare l’equilibrio negli esercizi unilaterali.',
    en: 'Visual focus on a fixed point can improve balance in unilateral exercises.',
  },
  {
    it: 'La progressione delle ripetizioni prima del peso è valida soprattutto per i principianti.',
    en: 'Adding reps before load is especially valid for beginners.',
  },
  {
    it: 'Il collagene con vitamina C può supportare la salute dei tendini se assunto regolarmente.',
    en: 'Collagen with vitamin C may support tendon health when taken regularly.',
  },
  {
    it: 'Evitare di guardare il telefono durante il recupero mantiene focus e ritmo della sessione.',
    en: 'Avoiding your phone during rest keeps session focus and rhythm.',
  },
  {
    it: 'La temperatura corporea sale di 1–2 °C durante un allenamento intenso.',
    en: 'Core temperature rises 1–2 °C during intense training.',
  },
  {
    it: 'Una serie saltata con motivo (fatica alta) è meglio di una serie eseguita con tecnica rovinata.',
    en: 'Skipping a set for high fatigue beats grinding with broken technique.',
  },
  {
    it: 'Il tracking del volume (kg × reps) aiuta a bilanciare carico e recupero nel tempo.',
    en: 'Tracking volume (kg × reps) helps balance load and recovery over time.',
  },
  {
    it: 'La musica con tempo moderato può ridurre la percezione di sforzo nelle serie lunghe.',
    en: 'Moderate-tempo music can lower perceived exertion on long sets.',
  },
  {
    it: 'Il raffreddamento leggero post-sessione facilita il ritorno allo stato di riposo.',
    en: 'A light cool-down post-session eases the return to rest.',
  },
  {
    it: 'La forza relativa (rapporto peso corporeo) è utile per confrontare atleti di taglie diverse.',
    en: 'Relative strength (bodyweight ratio) helps compare athletes of different sizes.',
  },
];
