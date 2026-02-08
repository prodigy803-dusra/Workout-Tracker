/**
 * Exercise guide data: video URLs, step-by-step instructions, and tips.
 * Keyed by normalized exercise name (lowercase, single-spaced, trimmed).
 */
export type ExerciseGuide = {
  url: string;
  steps: string;
  tips: string;
};

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  /* ═══════ QUADS — SQUATS ═══════ */
  'barbell back squat': {
    url: 'https://www.muscleandstrength.com/exercises/squat.html',
    steps:
      '1. Set the bar across your upper traps, unrack and step back with feet shoulder-width apart.\n' +
      '2. Brace your core, push your hips back and bend your knees.\n' +
      '3. Lower until your thighs are at least parallel to the floor.\n' +
      '4. Drive through your whole foot to stand back up.',
    tips:
      '• Keep your chest up and eyes forward throughout.\n' +
      '• Don\'t let your knees cave inward — push them out over your toes.\n' +
      '• Inhale and brace before descending; exhale at the top.',
  },
  'barbell front squat': {
    url: 'https://www.muscleandstrength.com/exercises/front-squat.html',
    steps:
      '1. Rest the bar on your front delts with a clean grip or crossed-arm grip.\n' +
      '2. Keep elbows high, unrack and step back.\n' +
      '3. Squat down keeping an upright torso until thighs are parallel.\n' +
      '4. Drive up through your heels to return to standing.',
    tips:
      '• High elbows are critical — if they drop, the bar rolls forward.\n' +
      '• This variation emphasizes quads more than back squats.\n' +
      '• Work on wrist/lat mobility if the clean grip feels uncomfortable.',
  },
  'safety bar squat': {
    url: 'https://www.muscleandstrength.com/exercises/safety-squat-bar-squat.html',
    steps:
      '1. Place the safety squat bar on your traps with handles in front.\n' +
      '2. Grip the handles, unrack and step back.\n' +
      '3. Squat down keeping your torso upright.\n' +
      '4. Drive up through your feet to stand.',
    tips:
      '• The bar naturally pushes you forward — fight to stay upright.\n' +
      '• Great for those with shoulder mobility issues.\n' +
      '• Use handles to push up and assist if needed.',
  },
  'zercher squat': {
    url: 'https://www.muscleandstrength.com/exercises/zercher-squat.html',
    steps:
      '1. Hold the bar in the crooks of your elbows close to your body.\n' +
      '2. Stand with feet shoulder-width apart.\n' +
      '3. Squat down keeping the bar tight to your torso.\n' +
      '4. Drive up through your heels to return.',
    tips:
      '• Use a pad or towel around the bar to protect your arms.\n' +
      '• Keeps you very upright — great for core and quad engagement.\n' +
      '• Start light to get used to the position.',
  },
  'smith machine squat': {
    url: 'https://www.muscleandstrength.com/exercises/smith-machine-squat.html',
    steps:
      '1. Position the bar across your upper back under the smith machine.\n' +
      '2. Place feet slightly in front of your hips.\n' +
      '3. Unrack and lower until thighs are parallel.\n' +
      '4. Press up to return to the start.',
    tips:
      '• Placing feet forward allows you to sit back more safely.\n' +
      '• The fixed bar path removes the need for stabilization.\n' +
      '• Good for beginners or high-rep burnout sets.',
  },
  'hack squat machine': {
    url: 'https://www.muscleandstrength.com/exercises/hack-squat.html',
    steps:
      '1. Position your back flat against the pad, shoulders under the pads.\n' +
      '2. Place feet shoulder-width on the platform.\n' +
      '3. Release the safety handles and lower until your knees are at 90°.\n' +
      '4. Press through your feet to extend your legs.',
    tips:
      '• Foot placement changes emphasis — higher = more glutes, lower = more quads.\n' +
      '• Don\'t lock out knees fully at the top.\n' +
      '• Keep your lower back pressed into the pad.',
  },
  'pendulum squat': {
    url: 'https://www.muscleandstrength.com/exercises/pendulum-squat.html',
    steps:
      '1. Step onto the platform and position your shoulders under the pads.\n' +
      '2. Release the safety, keep your back against the pad.\n' +
      '3. Lower by bending your knees until you reach full depth.\n' +
      '4. Push through your feet to extend.',
    tips:
      '• The arc motion keeps constant tension on the quads.\n' +
      '• Great for isolating quads with less spinal load.\n' +
      '• Control the negative — don\'t drop into the bottom.',
  },
  'belt squat': {
    url: 'https://www.muscleandstrength.com/exercises/belt-squat.html',
    steps:
      '1. Attach the belt around your hips and stand on the platforms.\n' +
      '2. Stand tall with arms free or holding handles for balance.\n' +
      '3. Squat down until thighs are parallel.\n' +
      '4. Drive up to standing.',
    tips:
      '• Zero spinal loading — excellent for back-friendly leg training.\n' +
      '• Keep an upright posture throughout.\n' +
      '• Vary stance width to change muscle emphasis.',
  },
  'goblet squat': {
    url: 'https://www.muscleandstrength.com/exercises/goblet-squat.html',
    steps:
      '1. Hold a dumbbell or kettlebell at chest height with both hands.\n' +
      '2. Stand with feet slightly wider than shoulder-width.\n' +
      '3. Squat down keeping the weight close to your chest, elbows inside your knees.\n' +
      '4. Drive up to return to standing.',
    tips:
      '• The front-loaded position naturally keeps you upright.\n' +
      '• Great warm-up exercise or for higher rep ranges.\n' +
      '• Push your knees out with your elbows at the bottom.',
  },

  /* ═══════ QUADS — LEG PRESS ═══════ */
  'leg press 45': {
    url: 'https://www.muscleandstrength.com/exercises/45-degree-leg-press.html',
    steps:
      '1. Sit in the machine with your back flat against the pad.\n' +
      '2. Place feet shoulder-width on the platform.\n' +
      '3. Release the safety, lower the weight by bending your knees to about 90°.\n' +
      '4. Press through your feet to extend without locking out.',
    tips:
      '• Don\'t let your lower back lift off the pad at the bottom.\n' +
      '• Higher foot placement shifts emphasis to glutes/hamstrings.\n' +
      '• Use a controlled tempo — don\'t bounce at the bottom.',
  },
  'horizontal leg press': {
    url: 'https://www.muscleandstrength.com/exercises/leg-press.html',
    steps:
      '1. Sit in the machine and place feet on the platform.\n' +
      '2. Push to release the weight, then bend knees toward your chest.\n' +
      '3. Lower until knees form about 90°.\n' +
      '4. Press back to the start without full lockout.',
    tips:
      '• Keep your head back and core braced.\n' +
      '• Similar principles to 45° press — adjust foot position for emphasis.\n' +
      '• Great for high-volume quad work with less fatigue.',
  },
  'single leg press': {
    url: 'https://www.muscleandstrength.com/exercises/single-leg-press.html',
    steps:
      '1. Sit in the leg press and place one foot centered on the platform.\n' +
      '2. Release the safety locks.\n' +
      '3. Lower the weight by bending your knee to about 90°.\n' +
      '4. Press through your foot to extend. Repeat on the other side.',
    tips:
      '• Use lighter weight than bilateral pressing.\n' +
      '• Helps identify and correct strength imbalances.\n' +
      '• Keep your hips square — don\'t rotate.',
  },

  /* ═══════ QUADS — ISOLATION ═══════ */
  'leg extension': {
    url: 'https://www.muscleandstrength.com/exercises/leg-extension.html',
    steps:
      '1. Sit in the machine with the pad resting on top of your ankles.\n' +
      '2. Adjust the back pad so your knees align with the machine pivot.\n' +
      '3. Extend your legs fully, squeezing your quads at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Squeeze and hold at the top for 1 second for maximum contraction.\n' +
      '• Don\'t use momentum to swing the weight up.\n' +
      '• Point your toes up (dorsiflexion) to increase quad activation.',
  },

  /* ═══════ HAMSTRINGS — HINGE ═══════ */
  'romanian deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/romanian-deadlift.html',
    steps:
      '1. Hold a barbell at hip height with an overhand grip.\n' +
      '2. Push your hips back, letting the bar slide down your thighs.\n' +
      '3. Lower until you feel a deep stretch in your hamstrings (mid-shin).\n' +
      '4. Drive your hips forward to return to the top.',
    tips:
      '• Keep a slight bend in your knees — this isn\'t a stiff-leg deadlift.\n' +
      '• The bar should stay close to your body the entire time.\n' +
      '• Think "hips back" not "bending over."',
  },
  'stiff leg deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/stiff-leg-deadlift.html',
    steps:
      '1. Hold a barbell with an overhand grip, legs nearly straight.\n' +
      '2. Hinge at the hips and lower the bar toward your feet.\n' +
      '3. Go as low as your hamstring flexibility allows.\n' +
      '4. Return to standing by extending your hips.',
    tips:
      '• Legs stay straighter than an RDL — more hamstring stretch.\n' +
      '• Keep a neutral spine throughout.\n' +
      '• Focus on feeling the stretch in the back of your legs.',
  },
  'conventional deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/deadlifts.html',
    steps:
      '1. Stand with feet hip-width, bar over mid-foot.\n' +
      '2. Bend down, grip the bar just outside your legs.\n' +
      '3. Brace your core, chest up, pull the slack out of the bar.\n' +
      '4. Drive through your feet to stand up, locking out hips and knees together.',
    tips:
      '• The bar should travel in a straight vertical line.\n' +
      '• Don\'t round your lower back — keep it neutral.\n' +
      '• Think of pushing the floor away rather than pulling the bar up.',
  },
  'sumo deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/sumo-deadlift.html',
    steps:
      '1. Take a wide stance with toes pointed out 30–45°.\n' +
      '2. Grip the bar inside your legs with arms straight down.\n' +
      '3. Drop your hips, chest up, and brace your core.\n' +
      '4. Drive through your feet, pushing your knees out, to stand up.',
    tips:
      '• This shifts more emphasis to quads, glutes and adductors.\n' +
      '• Hips should be closer to the bar than in conventional.\n' +
      '• Let the knees track over the toes throughout.',
  },
  'trap bar deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/trap-bar-deadlift.html',
    steps:
      '1. Stand inside the trap bar with feet hip-width.\n' +
      '2. Bend down and grip the handles.\n' +
      '3. Brace and drive through your feet to stand up.\n' +
      '4. Lower under control back to the floor.',
    tips:
      '• More quad-friendly than conventional deadlifts.\n' +
      '• The neutral grip reduces stress on the lower back.\n' +
      '• Great for beginners learning the hip hinge.',
  },
  'good morning': {
    url: 'https://www.muscleandstrength.com/exercises/good-morning.html',
    steps:
      '1. Place a barbell across your upper back like a squat.\n' +
      '2. With a slight knee bend, hinge forward at the hips.\n' +
      '3. Lower your torso until nearly parallel to the floor.\n' +
      '4. Return to upright by driving your hips forward.',
    tips:
      '• Start very light — this is a challenging movement.\n' +
      '• Keep the weight on your heels.\n' +
      '• Think of it as an RDL with the bar on your back.',
  },

  /* ═══════ HAMSTRINGS — CURLS ═══════ */
  'lying leg curl': {
    url: 'https://www.muscleandstrength.com/exercises/lying-leg-curl.html',
    steps:
      '1. Lie face down on the machine with the pad behind your ankles.\n' +
      '2. Adjust so your knees align with the machine pivot point.\n' +
      '3. Curl your heels toward your glutes, squeezing at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Don\'t lift your hips off the pad — keep them pressed down.\n' +
      '• Squeeze for a full second at the top.\n' +
      '• Avoid using momentum to swing the weight.',
  },
  'seated leg curl': {
    url: 'https://www.muscleandstrength.com/exercises/seated-leg-curl.html',
    steps:
      '1. Sit in the machine with the pad above your heels and thigh pad secured.\n' +
      '2. Curl your heels under the seat by bending your knees.\n' +
      '3. Squeeze at the bottom of the movement.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• The seated position stretches the hamstrings more at the top.\n' +
      '• Use a slow eccentric (3 seconds) for more growth stimulus.\n' +
      '• Don\'t fully straighten your legs at the top — keep tension.',
  },
  'nordic curl': {
    url: 'https://www.muscleandstrength.com/exercises/nordic-hamstring-curl.html',
    steps:
      '1. Kneel on a pad with your ankles locked under a pad or held by a partner.\n' +
      '2. Keep your body straight from knees to shoulders.\n' +
      '3. Slowly lower yourself forward under control as far as you can.\n' +
      '4. Use your hamstrings to pull yourself back up (or push off the floor to assist).',
    tips:
      '• Extremely effective but difficult — use a band for assistance if needed.\n' +
      '• Focus on the slow eccentric (lowering) if you can\'t do the concentric yet.\n' +
      '• Keep your hips extended — don\'t bend at the waist.',
  },

  /* ═══════ GLUTES ═══════ */
  'barbell hip thrust': {
    url: 'https://www.muscleandstrength.com/exercises/barbell-hip-thrust.html',
    steps:
      '1. Sit on the floor with your upper back against a bench, barbell over your hips.\n' +
      '2. Roll the bar into position over your hip crease (use a pad).\n' +
      '3. Drive through your heels to lift your hips until your body is flat from knees to shoulders.\n' +
      '4. Squeeze your glutes hard at the top, then lower under control.',
    tips:
      '• Chin should be slightly tucked — look forward, not at the ceiling.\n' +
      '• Your shins should be vertical at the top.\n' +
      '• Use a thick barbell pad to avoid hip bruising.',
  },
  'machine hip thrust': {
    url: 'https://www.muscleandstrength.com/exercises/machine-hip-thrust.html',
    steps:
      '1. Set up in the hip thrust machine with your back against the pad.\n' +
      '2. Place feet flat on the platform about shoulder-width.\n' +
      '3. Drive through your heels to extend your hips fully.\n' +
      '4. Squeeze at the top and lower slowly.',
    tips:
      '• The machine stabilizes everything so you can focus on squeezing.\n' +
      '• Experiment with foot position to find what you feel most in your glutes.\n' +
      '• Hold the top for 2 seconds for extra activation.',
  },
  'cable kickback': {
    url: 'https://www.muscleandstrength.com/exercises/cable-glute-kickback.html',
    steps:
      '1. Attach an ankle cuff to a low cable, face the machine.\n' +
      '2. Stand on one leg, holding the frame for balance.\n' +
      '3. Kick the working leg straight back, squeezing your glute.\n' +
      '4. Return slowly and repeat. Switch legs.',
    tips:
      '• Keep your torso still — don\'t lean forward excessively.\n' +
      '• Focus on squeezing the glute, not swinging the leg.\n' +
      '• Slight forward lean can increase range of motion.',
  },
  'bulgarian split squat': {
    url: 'https://www.muscleandstrength.com/exercises/bulgarian-split-squat.html',
    steps:
      '1. Stand lunge-length in front of a bench, place your rear foot on the bench.\n' +
      '2. Hold dumbbells at your sides (or barbell on back).\n' +
      '3. Lower by bending your front knee until your thigh is parallel.\n' +
      '4. Drive through your front foot to stand back up.',
    tips:
      '• Keep your front knee tracking over your toes.\n' +
      '• Most of your weight should be on the front foot.\n' +
      '• The farther your front foot is from the bench, the more glute activation.',
  },
  'walking lunge': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-lunges.html',
    steps:
      '1. Hold dumbbells at your sides, stand tall.\n' +
      '2. Step forward into a lunge, both knees bending to about 90°.\n' +
      '3. Push off your front foot and step your rear foot forward into the next lunge.\n' +
      '4. Continue alternating forward.',
    tips:
      '• Keep your torso upright throughout.\n' +
      '• Longer strides emphasize glutes; shorter strides emphasize quads.\n' +
      '• Lightly tap (don\'t slam) your rear knee toward the floor.',
  },
  'step up': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-step-up.html',
    steps:
      '1. Stand facing a box or bench, holding dumbbells at your sides.\n' +
      '2. Place one foot fully on the box.\n' +
      '3. Drive through that foot to step up, bringing your other foot to the top.\n' +
      '4. Step back down with the trailing leg. Repeat.',
    tips:
      '• Don\'t push off with your back foot — let the working leg do all the work.\n' +
      '• Higher box = more glute/hamstring involvement.\n' +
      '• Keep your torso upright.',
  },
  'hip abduction machine': {
    url: 'https://www.muscleandstrength.com/exercises/hip-abduction-machine.html',
    steps:
      '1. Sit in the machine with your back against the pad and spine neutral.\n' +
      '2. Place your legs against the inner pads.\n' +
      '3. Push the pads apart by externally rotating your hips.\n' +
      '4. Slowly return to the starting position.',
    tips:
      '• Experiment with leaning forward slightly to change the emphasis.\n' +
      '• Don\'t let your lower back arch — keep your pelvis neutral.\n' +
      '• Use a controlled tempo, especially on the return.',
  },

  /* ═══════ CALVES ═══════ */
  'standing calf raise': {
    url: 'https://www.muscleandstrength.com/exercises/standing-calf-raise.html',
    steps:
      '1. Stand on the edge of the platform with the balls of your feet, shoulders under the pads.\n' +
      '2. Lower your heels as far as possible to get a deep stretch.\n' +
      '3. Rise up onto your toes as high as you can.\n' +
      '4. Squeeze at the top, then lower slowly.',
    tips:
      '• Full range of motion is key — stretch at the bottom, squeeze at the top.\n' +
      '• Use a 2-second pause at both the top and bottom.\n' +
      '• Keep your legs straight to emphasize the gastrocnemius.',
  },
  'seated calf raise': {
    url: 'https://www.muscleandstrength.com/exercises/seated-calf-raise.html',
    steps:
      '1. Sit in the machine with the pad over your lower thighs.\n' +
      '2. Place the balls of your feet on the platform edge.\n' +
      '3. Release the safety, lower your heels for a full stretch.\n' +
      '4. Raise your heels as high as possible, squeezing at the top.',
    tips:
      '• The bent-knee position targets the soleus more.\n' +
      '• Use slow, controlled reps — calves respond well to time under tension.\n' +
      '• 15-30 rep range tends to work best for calves.',
  },
  'donkey calf raise': {
    url: 'https://www.muscleandstrength.com/exercises/donkey-calf-raise.html',
    steps:
      '1. Stand on the platform edge with your toes, bend forward at the hips.\n' +
      '2. Place the pad on your lower back/hips.\n' +
      '3. Lower your heels for a deep stretch.\n' +
      '4. Rise up onto your toes, squeezing at the top.',
    tips:
      '• The hip-flexed position provides a great stretch on the calves.\n' +
      '• If no machine is available, have a partner sit on your lower back.\n' +
      '• Use a full range of motion for best results.',
  },
  'tibialis raise': {
    url: 'https://www.muscleandstrength.com/exercises/tibialis-raise.html',
    steps:
      '1. Lean your back against a wall with feet about 2 feet in front.\n' +
      '2. Lift your toes up toward your shins.\n' +
      '3. Squeeze at the top.\n' +
      '4. Lower slowly.',
    tips:
      '• Strengthens the front of the shin — helps prevent shin splints.\n' +
      '• Can use a tib bar machine if available.\n' +
      '• High rep ranges (15-25) work well for this muscle.',
  },

  /* ═══════ CHEST — PRESS ═══════ */
  'barbell bench press': {
    url: 'https://www.muscleandstrength.com/exercises/barbell-bench-press.html',
    steps:
      '1. Lie on the bench with eyes under the bar, feet flat on the floor.\n' +
      '2. Grip the bar slightly wider than shoulder-width, unrack.\n' +
      '3. Lower the bar to your mid-chest with elbows at about 45°.\n' +
      '4. Press the bar up and slightly back to lockout.',
    tips:
      '• Retract and depress your shoulder blades — squeeze them together.\n' +
      '• Keep a slight arch in your lower back.\n' +
      '• Drive your feet into the floor for leg drive.',
  },
  'incline barbell bench': {
    url: 'https://www.muscleandstrength.com/exercises/incline-bench-press.html',
    steps:
      '1. Set the bench to 30–45° incline.\n' +
      '2. Grip the bar slightly wider than shoulder-width, unrack.\n' +
      '3. Lower the bar to your upper chest / collarbone area.\n' +
      '4. Press up to full lockout.',
    tips:
      '• Targets the upper chest more than flat bench.\n' +
      '• Don\'t set the incline too steep — 30° is often ideal.\n' +
      '• Keep your shoulder blades pinched back.',
  },
  'decline barbell bench': {
    url: 'https://www.muscleandstrength.com/exercises/decline-bench-press.html',
    steps:
      '1. Set the bench to a slight decline and hook your feet.\n' +
      '2. Unrack the bar with a standard grip.\n' +
      '3. Lower to your lower chest.\n' +
      '4. Press back up to lockout.',
    tips:
      '• Emphasizes the lower chest fibers.\n' +
      '• Many people feel stronger in this position.\n' +
      '• Have a spotter hand off the bar for safety.',
  },
  'dumbbell bench press': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-bench-press.html',
    steps:
      '1. Sit on a flat bench with dumbbells on your thighs, kick them up as you lie back.\n' +
      '2. Hold the dumbbells above your chest with arms extended.\n' +
      '3. Lower the weights to the sides of your chest, elbows at ~45°.\n' +
      '4. Press back up, squeezing your chest at the top.',
    tips:
      '• Dumbbells allow a greater range of motion than barbell.\n' +
      '• Rotate your wrists slightly so pinkies come together at the top.\n' +
      '• Control the descent — don\'t let gravity pull the weights down.',
  },
  'incline dumbbell press': {
    url: 'https://www.muscleandstrength.com/exercises/incline-dumbbell-bench-press.html',
    steps:
      '1. Set bench to 30–45° incline, kick dumbbells up from your thighs.\n' +
      '2. Start with dumbbells above your upper chest, arms extended.\n' +
      '3. Lower to the sides of your upper chest.\n' +
      '4. Press up, squeezing at the top.',
    tips:
      '• Great for targeting upper chest with a deeper stretch.\n' +
      '• Keep elbows at about 45° to protect your shoulders.\n' +
      '• Don\'t arch too much at the incline angle.',
  },
  'weighted pushup': {
    url: 'https://www.muscleandstrength.com/exercises/push-up.html',
    steps:
      '1. Get in a plank position with a weight plate on your upper back (or weighted vest).\n' +
      '2. Hands slightly wider than shoulder-width.\n' +
      '3. Lower your chest to the floor with elbows at ~45°.\n' +
      '4. Push back up to full extension.',
    tips:
      '• A partner can place/remove the plate for you.\n' +
      '• Keep your body in a straight line — don\'t sag your hips.\n' +
      '• A weighted vest is more practical for higher loads.',
  },
  'weighted decline pushup': {
    url: 'https://www.muscleandstrength.com/exercises/decline-push-up.html',
    steps:
      '1. Place your feet on a bench/box with hands on the floor.\n' +
      '2. Add a weight plate on your back (or use a vest).\n' +
      '3. Lower your chest toward the floor.\n' +
      '4. Press back up to full extension.',
    tips:
      '• The decline angle mimics an incline press — targets upper chest.\n' +
      '• The higher the feet, the more shoulder involvement.\n' +
      '• Keep core tight to avoid sagging.',
  },
  'dip': {
    url: 'https://www.muscleandstrength.com/exercises/weighted-dip.html',
    steps:
      '1. Grip the parallel bars and lift yourself to full arm extension.\n' +
      '2. Lean slightly forward for chest emphasis.\n' +
      '3. Lower by bending your elbows until your shoulders are below your elbows.\n' +
      '4. Press back up to full lockout.',
    tips:
      '• Leaning forward emphasizes chest; staying upright targets triceps.\n' +
      '• Add weight with a dip belt once bodyweight becomes easy.\n' +
      '• Don\'t go so deep that your shoulders hurt.',
  },
  'diamond pushup': {
    url: 'https://www.muscleandstrength.com/exercises/diamond-push-ups.html',
    steps:
      '1. Form a diamond shape with your index fingers and thumbs touching the floor.\n' +
      '2. Get into a push-up position with hands under your chest.\n' +
      '3. Lower your chest to your hands.\n' +
      '4. Press back up to full extension.',
    tips:
      '• Primarily targets the triceps with chest as secondary.\n' +
      '• Keep your elbows close to your body.\n' +
      '• Widen the diamond if wrist discomfort occurs.',
  },

  /* ═══════ CHEST — FLYS ═══════ */
  'pec deck': {
    url: 'https://www.muscleandstrength.com/exercises/pec-dec-fly.html',
    steps:
      '1. Sit in the machine with your back flat against the pad.\n' +
      '2. Place your forearms against the pads (or grip the handles).\n' +
      '3. Bring the pads together in front of your chest, squeezing.\n' +
      '4. Slowly return to the starting position with a stretch.',
    tips:
      '• Focus on the squeeze at the front for maximum contraction.\n' +
      '• Don\'t let the weight stack slam — control the eccentric.\n' +
      '• Keep a slight bend in your elbows.',
  },
  'dumbbell fly': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-flys.html',
    steps:
      '1. Lie on a flat bench with dumbbells above your chest, palms facing each other.\n' +
      '2. With a slight bend in your elbows, lower the weights out to the sides.\n' +
      '3. Lower until you feel a stretch in your chest.\n' +
      '4. Squeeze your chest to bring the dumbbells back together.',
    tips:
      '• Think of hugging a large tree — the arc motion is key.\n' +
      '• Don\'t go too heavy — this is a stretch/squeeze exercise.\n' +
      '• Keep the slight elbow bend constant throughout.',
  },
  'cable fly mid': {
    url: 'https://www.muscleandstrength.com/exercises/standing-cable-crossover.html',
    steps:
      '1. Set both cables to about shoulder height.\n' +
      '2. Stand in the center, grasp both handles, step forward slightly.\n' +
      '3. With elbows slightly bent, bring your hands together in front of your chest.\n' +
      '4. Slowly return to the stretched position.',
    tips:
      '• Constant cable tension throughout the entire range of motion.\n' +
      '• Cross your hands slightly at the front for a better squeeze.\n' +
      '• Great finisher exercise for the chest.',
  },
  'cable fly low to high': {
    url: 'https://www.muscleandstrength.com/exercises/low-cable-crossover.html',
    steps:
      '1. Set cables to the lowest position.\n' +
      '2. Grab handles and step forward, arms down at your sides.\n' +
      '3. Sweep your arms up and together in front of your upper chest.\n' +
      '4. Lower slowly back to the starting position.',
    tips:
      '• Targets the upper (clavicular) chest fibers.\n' +
      '• Don\'t shrug your shoulders — keep them down.\n' +
      '• A great alternative to incline flies.',
  },
  'cable fly high to low': {
    url: 'https://www.muscleandstrength.com/exercises/high-cable-crossover.html',
    steps:
      '1. Set cables to the highest position.\n' +
      '2. Grab handles, step forward, lean slightly.\n' +
      '3. Sweep your arms down and together in front of your lower chest.\n' +
      '4. Return slowly to the stretched position.',
    tips:
      '• Targets the lower chest fibers.\n' +
      '• Keep a slight bend in your elbows throughout.\n' +
      '• Control the weight — don\'t let it snap back.',
  },

  /* ═══════ BACK — VERTICAL PULL ═══════ */
  'pull up': {
    url: 'https://www.muscleandstrength.com/exercises/pull-up.html',
    steps:
      '1. Hang from a bar with an overhand grip, slightly wider than shoulder-width.\n' +
      '2. Engage your lats and pull your chest toward the bar.\n' +
      '3. Pull until your chin is over the bar.\n' +
      '4. Lower slowly to a full dead hang.',
    tips:
      '• Initiate the pull by depressing your shoulder blades, not bending your arms.\n' +
      '• Avoid kipping or swinging.\n' +
      '• Use an assisted machine or band if you can\'t do bodyweight yet.',
  },
  'chin up': {
    url: 'https://www.muscleandstrength.com/exercises/chin-up.html',
    steps:
      '1. Hang from a bar with a supinated (underhand) grip, shoulder-width.\n' +
      '2. Pull yourself up until your chin clears the bar.\n' +
      '3. Squeeze your lats and biceps at the top.\n' +
      '4. Lower all the way to a dead hang.',
    tips:
      '• Easier than pull-ups due to more bicep involvement.\n' +
      '• Great for building both back and bicep size.\n' +
      '• Keep your core tight to prevent swinging.',
  },
  'lat pulldown': {
    url: 'https://www.muscleandstrength.com/exercises/lat-pull-down.html',
    steps:
      '1. Sit at the machine, grip the bar wider than shoulder-width.\n' +
      '2. Lean back slightly (~15°).\n' +
      '3. Pull the bar to your upper chest, squeezing your lats.\n' +
      '4. Return slowly with arms fully extended overhead.',
    tips:
      '• Drive your elbows down and back, not just pulling with your arms.\n' +
      '• Don\'t lean too far back — it turns into a row.\n' +
      '• Full stretch at the top is important for lat development.',
  },
  'neutral pulldown': {
    url: 'https://www.muscleandstrength.com/exercises/close-grip-lat-pull-down.html',
    steps:
      '1. Attach a neutral grip (V-bar or close grip handle) to the cable.\n' +
      '2. Sit down and lean back slightly.\n' +
      '3. Pull the handle to your chest.\n' +
      '4. Extend your arms fully at the top.',
    tips:
      '• Neutral grip is often easier on the shoulders.\n' +
      '• Provides a longer range of motion than wide grip.\n' +
      '• Great for overall lat development.',
  },
  'dumbbell pullover': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-pullover.html',
    steps:
      '1. Lie across a bench (just your upper back supported) holding one dumbbell overhead.\n' +
      '2. With slightly bent elbows, lower the dumbbell behind your head.\n' +
      '3. Stretch until you feel it in your lats and chest.\n' +
      '4. Pull the dumbbell back over your chest using your lats.',
    tips:
      '• Keep the elbow bend constant — don\'t turn it into a press.\n' +
      '• Drop your hips slightly to increase the stretch.\n' +
      '• Works both lats and chest — focus on your lats by thinking "elbows down."',
  },

  /* ═══════ BACK — ROWS ═══════ */
  'barbell row': {
    url: 'https://www.muscleandstrength.com/exercises/bent-over-barbell-row.html',
    steps:
      '1. Stand with feet shoulder-width, hinge forward ~45° with a barbell hanging.\n' +
      '2. Grip slightly wider than shoulder-width, overhand or underhand.\n' +
      '3. Row the bar to your lower chest / upper abdomen.\n' +
      '4. Lower under control to full arm extension.',
    tips:
      '• Keep your back flat — don\'t round your spine.\n' +
      '• A little body English is fine on heavy sets, but don\'t make it a habit.\n' +
      '• Squeeze your shoulder blades together at the top.',
  },
  'one arm dumbbell row': {
    url: 'https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html',
    steps:
      '1. Place one knee and hand on a bench, other foot on the floor.\n' +
      '2. Hold a dumbbell in the free hand, arm hanging straight.\n' +
      '3. Row the dumbbell to your hip, driving your elbow back.\n' +
      '4. Lower slowly and repeat. Switch sides.',
    tips:
      '• Don\'t rotate your torso — keep your shoulders square.\n' +
      '• Drive your elbow past your torso for full contraction.\n' +
      '• Can also be done with one hand on a rack for support.',
  },
  'seated cable row': {
    url: 'https://www.muscleandstrength.com/exercises/seated-row.html',
    steps:
      '1. Sit at the cable station, feet on the footplates, knees slightly bent.\n' +
      '2. Grab the handle with arms extended.\n' +
      '3. Pull the handle to your abdomen, squeezing your shoulder blades.\n' +
      '4. Extend your arms forward slowly.',
    tips:
      '• Keep upright — don\'t swing your torso back and forth.\n' +
      '• Full stretch at the front, full squeeze at the back.\n' +
      '• Try different attachments for variety (V-bar, wide bar, rope).',
  },
  'chest supported row': {
    url: 'https://www.muscleandstrength.com/exercises/chest-supported-dumbbell-row.html',
    steps:
      '1. Set an incline bench to ~30–45°, lie face down with chest on the pad.\n' +
      '2. Hold dumbbells hanging straight down.\n' +
      '3. Row both dumbbells up, squeezing your shoulder blades.\n' +
      '4. Lower slowly.',
    tips:
      '• Eliminates momentum — pure back work.\n' +
      '• Great for those with lower back issues.\n' +
      '• Can also be done on a dedicated machine.',
  },
  't bar row': {
    url: 'https://www.muscleandstrength.com/exercises/t-bar-row.html',
    steps:
      '1. Straddle the T-bar or landmine setup.\n' +
      '2. Hinge forward and grip the handle.\n' +
      '3. Row the weight to your chest.\n' +
      '4. Lower under control.',
    tips:
      '• Allows heavier loads than most rowing variations.\n' +
      '• Keep your chest up and back neutral.\n' +
      '• A close grip targets the middle back more.',
  },

  /* ═══════ BACK — MISC ═══════ */
  'face pull': {
    url: 'https://www.muscleandstrength.com/exercises/face-pull.html',
    steps:
      '1. Set a cable with a rope attachment at upper chest to face height.\n' +
      '2. Grab the rope with both hands, step back.\n' +
      '3. Pull toward your face, separating your hands and rotating externally.\n' +
      '4. Squeeze your rear delts, then slowly extend back.',
    tips:
      '• A must-do for shoulder health and posture.\n' +
      '• Think of pulling to your ears, not your chin.\n' +
      '• Keep elbows high — at or above shoulder height.',
  },
  'reverse pec deck': {
    url: 'https://www.muscleandstrength.com/exercises/reverse-pec-deck-fly.html',
    steps:
      '1. Sit facing the pec deck machine, chest against the pad.\n' +
      '2. Grip the handles with your arms extended in front.\n' +
      '3. Pull the handles back in an arc, squeezing your rear delts.\n' +
      '4. Return slowly to the start.',
    tips:
      '• Keep a slight bend in your elbows throughout.\n' +
      '• Don\'t use too much weight — focus on the squeeze.\n' +
      '• Great for rear delt development and shoulder balance.',
  },
  'straight arm pulldown': {
    url: 'https://www.muscleandstrength.com/exercises/straight-arm-pulldown.html',
    steps:
      '1. Stand at a cable station with a bar or rope at the top.\n' +
      '2. With arms nearly straight, push the bar down in an arc to your thighs.\n' +
      '3. Squeeze your lats at the bottom.\n' +
      '4. Return slowly overhead.',
    tips:
      '• Keep just a slight bend in your elbows.\n' +
      '• Great for building mind-muscle connection with the lats.\n' +
      '• Use this as a warm-up or finisher.',
  },
  'back extension': {
    url: 'https://www.muscleandstrength.com/exercises/hyperextension.html',
    steps:
      '1. Position yourself on the back extension bench, hips on the pad.\n' +
      '2. Cross your arms over your chest or behind your head.\n' +
      '3. Lower your torso toward the floor.\n' +
      '4. Raise back up until your body is in a straight line.',
    tips:
      '• Don\'t hyperextend — stop when your body is in a straight line.\n' +
      '• Hold a weight plate at your chest for progressive overload.\n' +
      '• Squeeze your glutes at the top.',
  },
  'reverse hyper': {
    url: 'https://www.muscleandstrength.com/exercises/reverse-hyperextension.html',
    steps:
      '1. Lie face down on the reverse hyper bench, holding the handles.\n' +
      '2. Let your legs hang straight down.\n' +
      '3. Swing/raise your legs up until they\'re in line with your torso.\n' +
      '4. Lower slowly.',
    tips:
      '• Decompresses the spine while working the posterior chain.\n' +
      '• Don\'t swing excessively — use controlled momentum.\n' +
      '• Excellent for lower back rehab.',
  },

  /* ═══════ SHOULDERS ═══════ */
  'overhead press': {
    url: 'https://www.muscleandstrength.com/exercises/military-press.html',
    steps:
      '1. Stand or sit, unrack the barbell at collarbone height.\n' +
      '2. Brace your core and press the bar straight overhead.\n' +
      '3. Lock out with the bar over the back of your head.\n' +
      '4. Lower back to collarbone height under control.',
    tips:
      '• Move your head back slightly as the bar passes your face, then push it through.\n' +
      '• Squeeze your glutes to keep your lower back from arching.\n' +
      '• Full lockout overhead for maximum shoulder development.',
  },
  'dumbbell shoulder press': {
    url: 'https://www.muscleandstrength.com/exercises/seated-dumbbell-press.html',
    steps:
      '1. Sit on a bench (90° or slight incline), dumbbells at shoulder height.\n' +
      '2. Press overhead until arms are fully extended.\n' +
      '3. Lower the weights to ear level.\n' +
      '4. Repeat.',
    tips:
      '• Dumbbells allow a more natural arc than a barbell.\n' +
      '• Don\'t let the dumbbells drift too far in front of you.\n' +
      '• Can also be done standing for more core engagement.',
  },
  'arnold press': {
    url: 'https://www.muscleandstrength.com/exercises/arnold-press.html',
    steps:
      '1. Start with dumbbells in front of your face, palms facing you.\n' +
      '2. Press up while rotating your palms to face forward.\n' +
      '3. Lock out overhead with palms forward.\n' +
      '4. Reverse the motion as you lower back down.',
    tips:
      '• The rotation hits all three delt heads through the movement.\n' +
      '• Use controlled rotation — don\'t rush it.\n' +
      '• Named after Arnold Schwarzenegger — a classic exercise.',
  },
  'dumbbell lateral raise': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-lateral-raise.html',
    steps:
      '1. Stand with dumbbells at your sides, slight bend in elbows.\n' +
      '2. Raise the dumbbells out to your sides until arms are parallel to the floor.\n' +
      '3. Pause briefly at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Lead with your elbows, not your hands.\n' +
      '• Don\'t shrug — keep your traps relaxed.\n' +
      '• A slight forward lean can help isolate the side delts more.',
  },
  'cable lateral raise': {
    url: 'https://www.muscleandstrength.com/exercises/one-arm-cable-lateral-raise.html',
    steps:
      '1. Stand sideways to a low cable, grab the handle with the far hand.\n' +
      '2. With a slight elbow bend, raise your arm out to the side to shoulder height.\n' +
      '3. Hold briefly at the top.\n' +
      '4. Lower slowly. Do all reps, then switch sides.',
    tips:
      '• Cable provides constant tension throughout the range.\n' +
      '• Stand upright — don\'t lean away to cheat the weight.\n' +
      '• Great for mind-muscle connection with the side delts.',
  },
  'rear delt fly': {
    url: 'https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html',
    steps:
      '1. Hinge forward with dumbbells hanging below you, slight elbow bend.\n' +
      '2. Raise the dumbbells out to the sides, squeezing your rear delts.\n' +
      '3. Hold at the top briefly.\n' +
      '4. Lower slowly.',
    tips:
      '• Don\'t use momentum — keep the motion controlled.\n' +
      '• Think "pinch your shoulder blades" at the top.\n' +
      '• Can also be done seated on a bench for more stability.',
  },

  /* ═══════ TRAPS ═══════ */
  'barbell shrug': {
    url: 'https://www.muscleandstrength.com/exercises/barbell-shrug.html',
    steps:
      '1. Hold a barbell at arm\'s length with an overhand grip.\n' +
      '2. Shrug your shoulders straight up toward your ears.\n' +
      '3. Hold the contraction for a second.\n' +
      '4. Lower slowly.',
    tips:
      '• Straight up and down — don\'t roll your shoulders.\n' +
      '• Use straps if your grip limits you.\n' +
      '• Can go heavy — traps respond well to load.',
  },
  'dumbbell shrug': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-shrug.html',
    steps:
      '1. Stand with a dumbbell in each hand at your sides.\n' +
      '2. Shrug your shoulders up as high as possible.\n' +
      '3. Hold and squeeze at the top.\n' +
      '4. Lower under control.',
    tips:
      '• Dumbbells allow a slightly greater range of motion.\n' +
      '• Keep your arms straight — don\'t bend your elbows.\n' +
      '• Use a 2-second hold at the top for better activation.',
  },

  /* ═══════ BICEPS ═══════ */
  'barbell curl': {
    url: 'https://www.muscleandstrength.com/exercises/standing-barbell-curl.html',
    steps:
      '1. Stand with feet shoulder-width, grip a barbell underhand at shoulder width.\n' +
      '2. Keep elbows pinned to your sides.\n' +
      '3. Curl the bar up to shoulder height, squeezing your biceps.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Don\'t swing your body — keep it strict.\n' +
      '• Slight wrist supination at the top can improve the peak contraction.\n' +
      '• The straight bar hits both bicep heads well.',
  },
  'ez bar curl': {
    url: 'https://www.muscleandstrength.com/exercises/ez-bar-curl.html',
    steps:
      '1. Grip the EZ bar on the inner angled handles.\n' +
      '2. Stand upright, elbows at your sides.\n' +
      '3. Curl the bar up, squeezing at the top.\n' +
      '4. Lower slowly.',
    tips:
      '• Easier on the wrists than a straight bar.\n' +
      '• Don\'t let elbows drift forward — keep them pinned.\n' +
      '• Use the outer grip for more outer bicep emphasis.',
  },
  'dumbbell curl': {
    url: 'https://www.muscleandstrength.com/exercises/standing-dumbbell-curl.html',
    steps:
      '1. Stand with a dumbbell in each hand, arms at your sides, palms forward.\n' +
      '2. Curl one or both dumbbells up toward your shoulders.\n' +
      '3. Squeeze at the top and supinate (twist pinky up) for maximum contraction.\n' +
      '4. Lower slowly.',
    tips:
      '• Can be done alternating or simultaneously.\n' +
      '• Supination (twisting) is key for full bicep contraction.\n' +
      '• Keep upper arms stationary throughout.',
  },
  'hammer curl': {
    url: 'https://www.muscleandstrength.com/exercises/seated-hammer-curl.html',
    steps:
      '1. Hold dumbbells at your sides with a neutral (palms facing in) grip.\n' +
      '2. Curl the weights up keeping palms facing each other the entire time.\n' +
      '3. Squeeze at the top.\n' +
      '4. Lower under control.',
    tips:
      '• Targets the brachialis and brachioradialis in addition to biceps.\n' +
      '• Builds forearm and outer arm thickness.\n' +
      '• Can be done seated, standing, or alternating.',
  },
  'concentration curl': {
    url: 'https://www.muscleandstrength.com/exercises/concentration-curl.html',
    steps:
      '1. Sit on a bench, lean forward with one elbow braced against your inner thigh.\n' +
      '2. Hold a dumbbell with arm fully extended.\n' +
      '3. Curl the weight up toward your shoulder, squeezing hard.\n' +
      '4. Lower slowly.',
    tips:
      '• The braced position eliminates all momentum.\n' +
      '• Great for building the bicep peak.\n' +
      '• Focus on a slow eccentric (3 seconds).',
  },
  'preacher curl': {
    url: 'https://www.muscleandstrength.com/exercises/preacher-curl.html',
    steps:
      '1. Sit at a preacher bench with your upper arms flat on the pad.\n' +
      '2. Grip a barbell, EZ bar, or dumbbells with an underhand grip.\n' +
      '3. Curl the weight up, keeping your arms pressed into the pad.\n' +
      '4. Lower slowly to a full stretch.',
    tips:
      '• Don\'t slam to full extension at the bottom — control it.\n' +
      '• Isolates the short head of the biceps.\n' +
      '• Great for eliminating cheating from curls.',
  },
  'preacher curl machine': {
    url: 'https://www.muscleandstrength.com/exercises/machine-preacher-curl.html',
    steps:
      '1. Sit at the machine, place your upper arms on the pad.\n' +
      '2. Grip the handles.\n' +
      '3. Curl up, squeezing your biceps.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Machine keeps tension constant through the full range.\n' +
      '• Great for dropsets and high-rep finishers.\n' +
      '• Adjust the seat so your armpits rest at the top of the pad.',
  },

  /* ═══════ TRICEPS ═══════ */
  'skullcrusher': {
    url: 'https://www.muscleandstrength.com/exercises/lying-tricep-extension.html',
    steps:
      '1. Lie on a flat bench holding an EZ bar or dumbbells above your chest.\n' +
      '2. Keeping upper arms still, bend your elbows to lower the weight toward your forehead.\n' +
      '3. Stop just above your forehead (or behind your head for more stretch).\n' +
      '4. Extend your arms to press back up.',
    tips:
      '• Letting the bar go behind your head increases the stretch on the long head.\n' +
      '• Don\'t flare elbows — keep them pointing at the ceiling.\n' +
      '• Start light to protect your elbows.',
  },
  'tricep pushdown': {
    url: 'https://www.muscleandstrength.com/exercises/tricep-pushdown.html',
    steps:
      '1. Face a cable machine, grip the bar or rope with elbows at your sides.\n' +
      '2. Press the handle down until your arms are fully extended.\n' +
      '3. Squeeze your triceps hard at the bottom.\n' +
      '4. Let the handle come back up to about 90° elbow bend.',
    tips:
      '• Keep your elbows pinned to your sides — don\'t let them flare.\n' +
      '• A rope lets you spread at the bottom for extra contraction.\n' +
      '• Great for targeting the lateral head of the triceps.',
  },
  'overhead tricep extension': {
    url: 'https://www.muscleandstrength.com/exercises/overhead-tricep-extension.html',
    steps:
      '1. Stand or sit, hold a dumbbell, cable, or EZ bar overhead with arms extended.\n' +
      '2. Lower the weight behind your head by bending your elbows.\n' +
      '3. Feel the stretch in your triceps.\n' +
      '4. Extend your arms back to the starting position.',
    tips:
      '• Overhead position stretches the long head of the triceps.\n' +
      '• Keep elbows pointing forward, not flaring out.\n' +
      '• Cable version provides more constant tension.',
  },

  /* ═══════ CORE ═══════ */
  'cable crunch': {
    url: 'https://www.muscleandstrength.com/exercises/cable-crunch.html',
    steps:
      '1. Kneel in front of a high cable with a rope attachment.\n' +
      '2. Hold the rope at the sides of your head.\n' +
      '3. Crunch down by flexing your abs, bringing your elbows toward your knees.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• Don\'t pull with your arms — the motion should come from your abs.\n' +
      '• Think of curling your ribcage toward your pelvis.\n' +
      '• Keep your hips stationary.',
  },
  'hanging leg raise': {
    url: 'https://www.muscleandstrength.com/exercises/hanging-leg-raise.html',
    steps:
      '1. Hang from a pull-up bar with a slight arm bend.\n' +
      '2. With legs straight (or slightly bent), raise them until parallel or above.\n' +
      '3. Pause at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Avoid swinging — control the motion.\n' +
      '• Bend knees to make it easier, straighten legs to make it harder.\n' +
      '• Curl your pelvis up at the top for maximum ab engagement.',
  },
  'ab wheel rollout': {
    url: 'https://www.muscleandstrength.com/exercises/ab-wheel-roll-out.html',
    steps:
      '1. Kneel on the floor with the ab wheel in front of you.\n' +
      '2. Grip the handles and roll forward, extending your body.\n' +
      '3. Go as far as you can while maintaining a neutral spine.\n' +
      '4. Use your abs to pull yourself back to the starting position.',
    tips:
      '• Don\'t let your lower back sag — keep your core braced.\n' +
      '• Start with partial range and progress over time.\n' +
      '• Advanced: do these from your feet instead of knees.',
  },
  'plank': {
    url: 'https://www.muscleandstrength.com/exercises/front-plank.html',
    steps:
      '1. Get on your forearms and toes, body in a straight line.\n' +
      '2. Brace your core, squeeze your glutes.\n' +
      '3. Hold the position for the prescribed time.\n' +
      '4. Don\'t let your hips sag or pike up.',
    tips:
      '• Once you can hold 60 seconds, progress to harder variations.\n' +
      '• Think of pulling your elbows toward your toes (don\'t move them).\n' +
      '• Breathe normally throughout — don\'t hold your breath.',
  },
  'pallof press': {
    url: 'https://www.muscleandstrength.com/exercises/pallof-press.html',
    steps:
      '1. Stand sideways to a cable machine, handle at chest height.\n' +
      '2. Hold the handle at your chest with both hands.\n' +
      '3. Press the handle straight out in front of you, resisting the rotation.\n' +
      '4. Bring it back to your chest. Complete reps, then switch sides.',
    tips:
      '• Your core is working to resist rotation — anti-rotation exercise.\n' +
      '• Keep your hips and shoulders square to the front.\n' +
      '• Great for building functional core stability.',
  },

  /* ═══════ CONDITIONING ═══════ */
  'sled push': {
    url: 'https://www.muscleandstrength.com/exercises/sled-push.html',
    steps:
      '1. Load the sled and grip the high or low handles.\n' +
      '2. Lean into the sled at about a 45° body angle.\n' +
      '3. Drive through your legs, taking powerful steps.\n' +
      '4. Push for the prescribed distance or time.',
    tips:
      '• Low handle pushes are more quad/glute intensive.\n' +
      '• High handle pushes are easier and more upright.\n' +
      '• Great for conditioning with minimal eccentric stress.',
  },
  'sled pull': {
    url: 'https://www.muscleandstrength.com/exercises/sled-pull.html',
    steps:
      '1. Attach a strap to the sled and yourself (hips or hands).\n' +
      '2. Face away from the sled.\n' +
      '3. Walk forward, dragging the sled behind you.\n' +
      '4. Continue for the prescribed distance or time.',
    tips:
      '• Walking backward targets quads more.\n' +
      '• Walking forward targets posterior chain.\n' +
      '• Very low injury risk — no eccentric loading.',
  },
  'farmer carry': {
    url: 'https://www.muscleandstrength.com/exercises/farmers-walk.html',
    steps:
      '1. Pick up a heavy dumbbell or implement in each hand.\n' +
      '2. Stand tall with shoulders back and core braced.\n' +
      '3. Walk with short, controlled steps for the prescribed distance.\n' +
      '4. Set the weights down under control.',
    tips:
      '• Grip strength, core stability, and conditioning all in one.\n' +
      '• Keep your shoulders packed down — don\'t shrug.\n' +
      '• Walk in a straight line and avoid leaning side to side.',
  },
  'battle rope': {
    url: 'https://www.muscleandstrength.com/exercises/battle-ropes.html',
    steps:
      '1. Hold one end of the rope in each hand, stand with feet shoulder-width.\n' +
      '2. Alternate slamming the ropes up and down creating waves.\n' +
      '3. Keep your core tight and maintain a slight squat position.\n' +
      '4. Continue for the prescribed time or reps.',
    tips:
      '• Try different patterns: alternating waves, double slams, circles.\n' +
      '• Power comes from your whole body, not just your arms.\n' +
      '• Excellent for HIIT-style conditioning.',
  },
};
