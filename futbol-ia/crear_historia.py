#!/usr/bin/env python3
"""Genera escenas.json (para el montaje) y guion-historia.md (para leer y copiar prompts)."""
import json, os

STYLE = ("3D animated movie still, stylized caricature characters with big expressive eyes, "
         "cinematic lighting, shallow depth of field, highly detailed, vibrant colors, 16:9, no text, "
         "no club crests, no sponsor logos")
CHARS = {
    "MATEO": "MATEO: 17-year-old Spanish boy, messy black hair, round glasses, freckles, oversized red hoodie",
    "CR7": "CR7: very muscular Portuguese footballer caricature, slick dark hair, perfect smile, classic plain white football kit number 7",
    "MESSI": "MESSI: short calm Argentine footballer caricature, brown beard, blue and garnet vertical striped shirt number 10",
    "NEY": "NEYMAR: Brazilian footballer caricature, blonde mohawk, gold chains, tattoos, blue and garnet striped shirt number 11",
    "BENZ": "BENZEMA: French striker caricature, neat dark beard, sunglasses, serious face, plain white kit number 9",
    "RAMOS": "RAMOS: Spanish defender caricature, long slicked-back hair, beard, tattoos, plain white kit number 4",
    "VILLA": "THE COLLECTOR: tall thin villain, purple velvet coat, golden monocle, black top hat, white gloves",
}

# (personajes, plano para la imagen, narración)
E = [
 # --- GANCHO
 ("MATEO MESSI VILLA", "dark bunker full of stolen golden trophies, Mateo and Messi tied to chairs with golden ribbons, Messi eating popcorn calmly, Mateo terrified, villain silhouette in the background",
  "Hace un mes estaba atado a una silla, en un búnker lleno de trofeos robados… y a mi lado estaba Messi. Comiendo palomitas."),
 ("MATEO", "close-up of Mateo sweating, looking at camera, dramatic red light",
  "Y no, no estoy exagerando. Esta es la historia de cómo pasé de ser un chaval normal de Getafe… a estar en medio del robo más absurdo de la historia del fútbol."),
 ("MATEO CR7", "Mateo standing next to CR7 in a luxury trophy room, CR7 angry pointing at Mateo",
  "Una historia en la que Cristiano Ronaldo me acusó de ladrón. Y en la que, al final, fui yo quien lo resolvió todo."),
 ("MATEO", "Mateo in his small messy bedroom with football posters, holding a phone, shocked",
  "Pero vamos desde el principio. Todo empezó con un correo."),
 # --- EL CONCURSO
 ("MATEO", "Mateo reading a phone screen glowing in his face, mouth wide open, at night in his bedroom",
  "Llevaba meses participando en sorteos de todo tipo. Camisetas, entradas, botas… nunca me tocaba nada. Hasta que una noche, a las tres de la mañana, me llegó esto."),
 ("MATEO", "Mateo jumping on his bed screaming with joy, papers flying",
  "«Enhorabuena. Has ganado una semana como asistente personal en la casa de Cristiano Ronaldo.» Grité tanto que mi madre pensó que me había caído por la ventana."),
 ("MATEO", "Mateo's mother in pajamas at the bedroom door, arms crossed, skeptical, Mateo showing her the phone",
  "Mi madre no se lo creía. Yo tampoco. Pensé que era una estafa. Pero dos días después, un coche negro aparcó delante de mi casa."),
 ("MATEO", "black luxury car in front of a humble apartment building, neighbors looking from balconies, Mateo with a backpack",
  "Todo el barrio estaba en los balcones. Yo subí al coche con una mochila, dos sudaderas y cero idea de lo que me esperaba."),
 # --- LA MANSIÓN
 ("MATEO", "huge modern mansion in Madrid with pools and palm trees at sunset, Mateo tiny at the gate looking up",
  "La casa era enorme. Tenía tres piscinas, un gimnasio más grande que mi instituto y un garaje con más coches que un concesionario."),
 ("MATEO CR7", "CR7 opening the door, shirtless under a white training jacket, huge smile, Mateo intimidated",
  "Y entonces abrió la puerta él. Cristiano. Me dio la mano tan fuerte que todavía me duele. «Bienvenido, Mateo. Aquí trabajamos duro.»"),
 ("MATEO CR7", "CR7 showing Mateo a wall-sized schedule with times starting at 5:00, Mateo yawning",
  "No era broma. Me dio un horario. Despertarse a las cinco. Baño de hielo a las cinco y diez. Entrenamiento a las cinco y media. Desayuno: claras de huevo y brócoli."),
 ("MATEO", "Mateo shivering inside an ice bath, face blue, teeth chattering, CR7 behind him with a stopwatch",
  "El primer día casi me congelo. Cristiano me miraba con un cronómetro y decía «tres minutos más». Yo veía mi vida pasar por delante."),
 ("MATEO CR7", "CR7 and Mateo in a kitchen, CR7 throwing a chocolate bar into the trash with disgust",
  "Y lo peor: en esa casa no había azúcar. Ni una galleta. Cristiano me pilló con una chocolatina y la tiró a la basura como si fuera una bomba."),
 ("MATEO CR7", "glass trophy room at night, five golden balls on illuminated pedestals, CR7 polishing one lovingly, Mateo watching from the door",
  "Pero lo más raro pasaba por las noches. Todas las noches, antes de dormir, Cristiano entraba en una sala de cristal… y contaba sus Balones de Oro."),
 ("CR7", "close-up CR7 kissing a golden ball, warm golden light",
  "«Uno, dos, tres, cuatro, cinco. Perfectos.» Los limpiaba uno a uno. Les daba las buenas noches. Te lo juro."),
 ("MATEO", "Mateo in bed in a luxury guest room, eyes wide, looking at the ceiling",
  "Yo pensaba que era una manía de famoso. No sabía que esa sala iba a cambiarlo todo."),
 # --- LA NOCHE DEL ROBO
 ("MATEO", "Mateo waking up in the dark, clock showing 3:00, moonlight through the window",
  "La tercera noche me desperté a las tres de la mañana. Tenía sed. Bajé a la cocina en calcetines, sin hacer ruido."),
 ("MATEO VILLA", "dark hallway, Mateo holding a glass of water, a tall purple shadow with a top hat passing at the end of the corridor",
  "Y entonces lo vi. Al fondo del pasillo. Una sombra alta, con sombrero de copa. Pasó delante de la sala de trofeos… y desapareció."),
 ("MATEO", "Mateo frozen, glass of water falling in slow motion",
  "Me quedé congelado. Se me cayó el vaso. Cuando miré otra vez, ya no había nadie."),
 ("MATEO", "Mateo back in bed, covering himself with the blanket up to his eyes",
  "Pensé que lo había soñado. Que era el sueño, el cansancio, el baño de hielo. Volví a la cama. Y ese fue mi gran error."),
 # --- EL DESCUBRIMIENTO
 ("CR7", "morning, CR7 in the trophy room holding a golden ball that is bending, confused face",
  "A la mañana siguiente, Cristiano entró a la sala como siempre. Cogió uno de sus balones… y notó algo raro. Estaba blando."),
 ("CR7", "extreme close-up CR7 biting a golden ball revealing chocolate inside, eyes wide in horror",
  "Le dio un mordisco. Era de chocolate. Chocolate envuelto en papel dorado. Uno de sus Balones de Oro… había desaparecido."),
 ("CR7", "CR7 screaming at the sky, veins on his neck, dramatic camera from below",
  "El grito se oyó en toda la urbanización. «¡¿CHOCOLATE?! ¡¡YO NO COMO AZÚCAR!!»"),
 ("MATEO CR7", "CR7 turning slowly towards Mateo with suspicious eyes, Mateo holding a chocolate wrapper in his hand",
  "Y entonces me miró a mí. Al único de la casa que había intentado meter chocolate el primer día."),
 ("MATEO CR7", "security monitor room, CR7 pointing at a screen showing a blurry figure in a red hoodie",
  "Fuimos a las cámaras de seguridad. Y ahí estaba: una figura con una sudadera roja. Igual que la mía. Entrando en la sala a las tres de la mañana."),
 ("MATEO", "Mateo shaking his head desperately, hands up, sweating",
  "Yo intenté explicarle lo de la sombra, lo del sombrero. Pero sonaba a excusa. Hasta yo me habría creído culpable."),
 ("MATEO CR7", "CR7 holding a phone, Mateo sitting alone on a huge sofa looking small and sad",
  "Cristiano cogió el teléfono. Pensé que iba a llamar a la policía. Pero llamó a alguien peor."),
 # --- BENZEMA
 ("BENZ", "Benzema arriving in a black sports car, stepping out in slow motion with sunglasses",
  "Veinte minutos después llegó Benzema. Gafas de sol, cara seria. No dijo ni hola. Fue directo a las cámaras."),
 ("BENZ MATEO", "Benzema watching security footage, pausing it, Mateo nervous behind him",
  "Vio el vídeo diez veces. Luego me miró de arriba abajo. Y dijo una frase que me salvó la vida."),
 ("BENZ", "close-up Benzema lowering his sunglasses, serious look",
  "«Este chico mide uno sesenta y cinco. El de la cámara llega casi al marco de la puerta.» El ladrón era mucho más alto que yo."),
 ("MATEO CR7 BENZ", "CR7 thinking with hand on chin, Benzema calm, Mateo relieved",
  "Cristiano se quedó pensando. Si no era yo… ¿quién iba a querer un Balón de Oro? Y a los dos se les ocurrió el mismo nombre a la vez."),
 ("CR7", "CR7 looking at a map of Spain on a big screen with Barcelona highlighted",
  "«Barcelona.» Cristiano estaba convencido de que alguien de allí quería quitarle la ventaja. Y yo, que no tenía nada que perder, me subí al coche."),
 # --- VIAJE
 ("MATEO CR7 BENZ", "white sports car speeding on a coastal highway at sunset, CR7 driving, Benzema calm, Mateo squeezed in the back seat",
  "Seiscientos kilómetros en un coche de dos plazas y media. Yo iba detrás, encogido, con las rodillas en la boca."),
 ("CR7 BENZ", "inside the car, CR7 angry talking, Benzema eating sunflower seeds calmly",
  "Cristiano no paraba de hablar. Que si era una venganza, que si era envidia, que si se iba a enterar. Benzema solo comía pipas."),
 ("MATEO", "Mateo looking out the car window thinking, reflection of a purple shadow in the glass",
  "Yo no paraba de pensar en la sombra del sombrero. Algo no encajaba. Nadie que yo conociera iba vestido así."),
 # --- CASA DE MESSI
 ("MESSI", "cozy house in Barcelona, Messi sitting on a sofa drinking mate, shelf behind him with eight golden balls",
  "Llegamos a casa de Messi. Estaba en el sofá, tomando mate, tan tranquilo. Detrás de él, una estantería con ocho Balones de Oro."),
 ("CR7 MESSI", "CR7 kicking the door open dramatically, Messi not even flinching, sipping mate",
  "Cristiano abrió la puerta de una patada. «¡¿Dónde está mi balón?!» Messi ni se inmutó. Dio un sorbo al mate."),
 ("MESSI", "close-up Messi shrugging calmly, slight smile",
  "«Tengo ocho, Cris. ¿Para qué quiero el tuyo?» Y la verdad… era un buen argumento."),
 ("CR7", "CR7 counting the balls on the shelf with his finger, offended face",
  "Cristiano se puso a contar los balones de la estantería. Uno, dos, tres… cuando llegó a ocho se le cambió la cara. Creo que le dolió más eso que el robo."),
 ("NEY", "Neymar entering the house dancing with headphones, glitter falling from his clothes",
  "Y justo entonces entró Neymar. Bailando, con cascos, lleno de purpurina hasta las cejas. «¿Fiesta? ¡Nadie me invitó!»"),
 ("BENZ", "Benzema crouching, holding up a pinch of glitter from the floor, serious",
  "Benzema se agachó, cogió un poco de purpurina del suelo… y sacó una bolsita del bolsillo. «En la sala de trofeos también había purpurina.»"),
 ("MATEO CR7 MESSI NEY BENZ", "everyone in the room slowly turning their heads to look at Neymar, dramatic silence",
  "Silencio. Todos giramos la cabeza a la vez hacia Neymar."),
 # --- PERSECUCIÓN
 ("NEY CR7", "comedic chase through narrow Barcelona streets, Neymar running doing skill moves past fruit stands, CR7 sprinting behind",
  "Neymar salió corriendo. Cristiano detrás. Yo detrás de Cristiano. Y Benzema… en un patinete eléctrico, sin prisa."),
 ("NEY", "Neymar jumping over a fruit stall, oranges flying everywhere, tourists shocked",
  "Neymar saltaba puestos de fruta, regateaba a turistas, hacía bicicletas a las palomas. «¡Que yo no fui! ¡La purpurina es mi perfume!»"),
 ("MATEO", "Mateo exhausted, bent over with hands on knees, in a Barcelona street, out of breath",
  "Yo ya no podía más. Me paré a respirar en una esquina. Y fue ahí cuando vi algo que nadie más había visto."),
 ("MATEO", "close-up of Mateo's hand picking a thread of purple velvet from a wall, golden light",
  "Enganchado en una pared había un hilo. De terciopelo morado. El mismo color que la sombra de la mansión."),
 ("NEY", "Neymar sitting inside a fountain, soaked, sad face, glitter floating on the water",
  "Al final Neymar tropezó y cayó dentro de una fuente. Empapado, con purpurina flotando alrededor, dijo: «Me la echaron encima en una fiesta. Un tío con sombrero.»"),
 ("MATEO", "Mateo's eyes widening, dramatic zoom",
  "Un tío con sombrero. Ahí lo entendí. La purpurina no era una prueba. Era una trampa para que sospecháramos de Neymar."),
 # --- LA CARTA
 ("MATEO CR7 BENZ NEY", "a grey pigeon landing on CR7's head carrying a golden envelope with a purple wax seal",
  "Y como si el ladrón nos estuviera escuchando, una paloma se posó en la cabeza de Cristiano. Llevaba un sobre dorado con un sello morado."),
 ("BENZ", "Benzema opening an elegant letter, purple ink calligraphy visible but unreadable",
  "Benzema lo abrió y lo leyó en voz alta. «Querido Siete. Un balón no basta. Esta noche tendré también los ocho del Diez. Firmado: El Coleccionista.»"),
 ("MESSI", "Messi arriving behind them holding his mate, freezing mid-sip",
  "Messi, que acababa de llegar detrás de nosotros, se quedó con el mate a medio camino. «…¿Mis ocho?»"),
 ("MATEO", "Mateo searching on his phone, screen glowing, old newspaper articles about stolen trophies",
  "Busqué «El Coleccionista» en internet. Salían noticias de hace años: trofeos desaparecidos por todo el mundo. Copas, medallas, botas de oro. Nunca lo habían pillado."),
 # --- EL PLAN
 ("MATEO CR7 MESSI NEY BENZ", "everyone around a kitchen table at night, Mateo drawing a plan on a napkin",
  "Esa noche nos reunimos en la cocina de Messi. Todos querían esconder los balones. Pero yo tuve otra idea."),
 ("MATEO", "Mateo holding up a chocolate ball wrapped in gold foil, smiling cleverly",
  "«¿Y si le damos lo que quiere… pero falso?» Cambiamos los ocho balones de Messi por balones de chocolate. Como hizo él."),
 ("CR7", "CR7 looking at chocolate balls with disgust, holding his nose",
  "A Cristiano casi le da algo al ver tanto chocolate junto. Pero aceptó."),
 ("MATEO", "Mateo climbing inside a large wooden trophy box, closing the lid, determined",
  "Y luego hice la mayor locura de mi vida: me escondí dentro de la caja de los trofeos. Si el ladrón se los llevaba… me llevaba a mí también."),
 # --- SECUESTRO
 ("MESSI", "night, Barcelona street, a purple helicopter lowering a giant arcade-style claw over Messi's house",
  "A las tres en punto se oyó un helicóptero. Morado. Con una garra gigante como las de las máquinas de peluches."),
 ("MESSI", "the giant claw lifting Messi into the air while he still holds his mate, waving calmly",
  "Pero la garra no fue a por la caja. Fue a por Messi. Lo levantó del jardín, con el mate en la mano. «Che… que alguien avise a mi mujer.»"),
 ("MATEO", "second claw grabbing the wooden box with Mateo inside, Mateo peeking terrified through a crack",
  "Y luego bajó otra garra. Y cogió la caja. Conmigo dentro. Lo último que oí fue a Cristiano gritando «¡¡LEOOO!!» mientras subíamos al cielo."),
 # --- EL BÚNKER
 ("VILLA", "underground bunker under a castle, walls full of stolen trophies, the villain opening his arms theatrically",
  "Nos llevaron a un búnker debajo de un castillo. Las paredes estaban llenas de trofeos. Miles. Y en el centro estaba él."),
 ("VILLA", "close-up of the villain adjusting his golden monocle, sinister smile",
  "El Coleccionista. Alto, abrigo de terciopelo morado, monóculo dorado. Sonreía como si estuviera en un museo."),
 ("MATEO MESSI", "Mateo and Messi tied to chairs with golden ribbons, Messi eating popcorn, Mateo panicking",
  "Nos ataron a los dos a unas sillas con cintas doradas. Yo temblaba. Messi pidió palomitas. Y se las dieron."),
 ("VILLA", "the villain telling a story, flashback style image of a young thin ballboy at a stadium being ignored",
  "Entonces nos contó su historia. De joven fue recogepelotas. Veinte años recogiendo balones. Y ni un solo jugador le dio las gracias."),
 ("VILLA", "the villain gesturing at a huge empty golden pedestal in the center of the bunker",
  "«Si el mundo no me da un trofeo, me quedaré con todos.» Y nos enseñó un pedestal enorme, vacío. «Aquí irá la Copa del Mundo.»"),
 ("MATEO", "close-up of a smartwatch on Mateo's wrist blinking with a GPS icon",
  "Y entonces me acordé. El primer día Cristiano me había dado un reloj para controlar mis entrenamientos. Tenía GPS. Y él veía mi ubicación en su móvil."),
 ("MATEO", "Mateo pressing the watch button with his chin, sneaky face",
  "Le di al botón de emergencia con la barbilla. Solo me quedaba esperar. Y rezar."),
 # --- RESCATE
 ("RAMOS", "Sergio Ramos caricature arriving on a red motorcycle in slow motion at the castle gate, hair flowing",
  "Lo que no sabía es que, mientras tanto, Cristiano había llamado refuerzos. Y apareció el más intenso de todos: Ramos. En moto. A cámara lenta."),
 ("RAMOS", "Ramos smashing through the bunker steel door with his shoulder, debris flying",
  "«Me han dicho que hay un búnker. Yo entro donde sea.» Y entró. Por la puerta. Rompiéndola."),
 ("NEY", "Neymar dancing in front of confused guards in purple uniforms, guards starting to dance too",
  "Neymar se plantó delante de los guardias y se puso a bailar. A los diez segundos estaban todos bailando con él."),
 ("BENZ", "Benzema calmly cutting a wire on an alarm panel with scissors, sunglasses on",
  "Benzema desactivó la alarma sin quitarse las gafas. Sin prisa. Como si estuviera haciendo un crucigrama."),
 ("CR7 VILLA", "CR7 facing the villain in the middle of the trophy bunker, epic standoff, dramatic lighting",
  "Y Cristiano se plantó delante del Coleccionista. «Devuélveme mi balón.» «Nadie toca mi colección.»"),
 ("MATEO", "Mateo with untied hands holding up a chocolate golden ball, shining under a spotlight",
  "Pero yo ya había conseguido soltarme. Y sabía su punto débil: no podía resistirse a nada que brillara. Levanté el balón de chocolate."),
 ("VILLA", "the villain jumping towards the shiny chocolate ball with greedy eyes, mid-air",
  "«¡El noveno balón!» gritó. Y saltó a por él como un niño a por un caramelo."),
 ("CR7", "CR7 doing his famous jump celebration in mid-air, the villain falling backwards into a golden cage",
  "Cristiano saltó a la vez. «¡¡SIUUUUU!!» El grito fue tan fuerte que el Coleccionista se asustó, tropezó… y cayó dentro de su propia jaula de trofeos."),
 ("MATEO", "golden cage door slamming shut, Mateo locking it with a key, triumphant",
  "Y yo cerré la puerta. Clic."),
 # --- FINAL
 ("MATEO CR7 MESSI NEY BENZ RAMOS", "sunrise on a rooftop overlooking the city, the whole team together holding golden balls",
  "Al amanecer estábamos todos en la azotea del castillo. Habíamos recuperado el balón de Cristiano, los ocho de Messi… y miles de trofeos robados del mundo entero."),
 ("CR7 MATEO", "CR7 putting a hand on Mateo's shoulder, sincere smile",
  "Cristiano se acercó a mí. «Perdóname por acusarte, Mateo. Sin ti, esto no se resuelve.» Y me dio algo."),
 ("MATEO", "close-up of Mateo holding a bitten chocolate golden ball with a signature on the gold foil",
  "El balón de chocolate. El mordido. Firmado por todos. Es lo más valioso que tengo. Y no, no me lo he comido."),
 ("CR7 MESSI", "CR7 and Messi shaking hands awkwardly, then starting to argue, Neymar laughing behind",
  "Luego Messi y Cristiano se dieron la mano. Y duró tres segundos. «Que conste que yo te rescaté.» «Y yo tengo ocho.»"),
 ("MATEO", "Mateo laughing with the sunrise behind him, warm emotional light",
  "Y yo me reí como no me había reído en mi vida. Hay rivalidades que ni un secuestro puede romper."),
 # --- POST-CRÉDITOS
 ("VILLA", "the villain inside the golden cage in a dark prison cell, smiling, writing in a small notebook",
  "Pero esto no acaba aquí. Hace una semana me llegó otra carta. Con sello morado."),
 ("MATEO", "Mateo holding a letter with a purple wax seal, terrified face, dramatic shadow",
  "Solo ponía tres palabras: «Próximo objetivo: Mundial.» Si queréis saber qué pasó… suscribíos. Porque esto, os lo juro, no ha hecho más que empezar."),
]

out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "historia")
escenas = []
md = ["# Le Robaron El Balón De Oro A Cristiano… Y Me Culparon A Mí",
      "", "Parodia animada de ficción · narrador original (Mateo) · aprox. %d escenas" % len(E), "",
      "## Estilo (va incluido en cada prompt)", "`" + STYLE + "`", "",
      "## Personajes", *["- " + v for v in CHARS.values()], "",
      "## Cómo usarlo",
      "1. Genera cada imagen con su prompt y guárdala como `public/historia/img/001.png`, `002.png`…",
      "2. (Opcional) graba la voz de cada escena como `public/historia/voz/001.mp3`… Si no hay voz, el montaje calcula la duración por palabras.",
      "3. `npx remotion render HistoriaIA out/historia.mp4`", "", "---", ""]
total_words = 0
for i, (chars, shot, text) in enumerate(E, 1):
    who = chars.split()
    prompt = f"{STYLE}. " + "; ".join(CHARS[c] for c in who) + f". Scene: {shot}"
    escenas.append({"id": f"{i:03d}", "texto": text, "prompt": prompt})
    total_words += len(text.split())
    md += [f"### {i:03d}", f"**Narración:** {text}", "", f"**Prompt:** `{prompt}`", ""]
md.insert(3, f"Duración estimada: ~{total_words / 2.6 / 60:.1f} min ({total_words} palabras)")
json.dump(escenas, open(os.path.join(out_dir, "escenas.json"), "w"), ensure_ascii=False, indent=1)
open(os.path.join(os.path.dirname(__file__), "guion-historia.md"), "w").write("\n".join(md))
print(len(escenas), "escenas,", total_words, "palabras, ~%.1f min" % (total_words / 2.6 / 60))
