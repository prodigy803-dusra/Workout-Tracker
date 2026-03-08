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
      '• Inhale and brace before descending; exhale at the top.\n' +
      '\n💡 Cue: "Spread the floor apart" with your feet — this activates your glutes and prevents knee cave.',
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
      '• Work on wrist/lat mobility if the clean grip feels uncomfortable.\n' +
      '\n💡 Cue: "Elbows to the ceiling" — as you stand up, drive your elbows up first. This keeps your torso upright and prevents the bar from dumping forward.',
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
      '• Use a bar pad, towel, or fat gripz to protect the crooks of your elbows.\n' +
      '• Forces an extremely upright torso — great for quad and core development.\n' +
      '• Start light to build tolerance for the bar position.\n' +
      '\n💡 Cue: "Hug the bar into your chest" as you stand — this braces your core and keeps you from folding forward.',
  },
  'smith machine squat': {
    url: 'https://www.muscleandstrength.com/exercises/smith-machine-squat.html',
    steps:
      '1. Position the bar across your upper back under the smith machine.\n' +
      '2. Place feet slightly in front of your hips.\n' +
      '3. Unrack and lower until thighs are parallel.\n' +
      '4. Press up to return to the start.',
    tips:
      '• Place feet 6-12 inches in front of the bar to sit back safely.\n' +
      '• The fixed bar path lets you focus on depth and tempo without balance concerns.\n' +
      '• Good for high-rep burnout sets or training without a spotter.\n' +
      '\n💡 Cue: "Sit into a chair behind you" — the feet-forward position makes this feel more like a wall sit, targeting your quads.',
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
      '• Use a controlled tempo — don\'t bounce at the bottom.\n' +
      '\n💡 Cue: Push through your midfoot for quad emphasis, or through your heels for more glute/hamstring.',
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
      '• Point your toes up (dorsiflexion) to increase quad activation.\n' +
      '\n💡 Cue: Push your knees slightly outward against the pad — this engages the VMO (inner quad) more effectively.',
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
      '• Think "hips back" not "bending over."\n' +
      '\n💡 Cue: Imagine closing a car door with your butt — that\'s the hip hinge. Drag the bar along your thighs like you\'re painting them.',
  },
  'stiff leg deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/stiff-leg-deadlift.html',
    steps:
      '1. Hold a barbell with an overhand grip, legs nearly straight.\n' +
      '2. Hinge at the hips and lower the bar toward your feet.\n' +
      '3. Go as low as your hamstring flexibility allows.\n' +
      '4. Return to standing by extending your hips.',
    tips:
      '• Knees stay nearly locked (slight bend) — straighter than an RDL.\n' +
      '• Stop the descent when your back starts rounding, not when the bar reaches a set height.\n' +
      '• Great for building hamstring flexibility; depth improves over time.\n' +
      '\n💡 Cue: "Push your hips behind you like closing a car door with your butt" — this loads the hamstrings instead of straining your lower back.',
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
      '• Think of pushing the floor away rather than pulling the bar up.\n' +
      '\n💡 Cue: "Squeeze oranges in your armpits" — this engages your lats to keep the bar tight to your body and protects your back.',
  },
  'sumo deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/sumo-deadlift.html',
    steps:
      '1. Take a wide stance with toes pointed out 30–45°.\n' +
      '2. Grip the bar inside your legs with arms straight down.\n' +
      '3. Drop your hips, chest up, and brace your core.\n' +
      '4. Drive through your feet, pushing your knees out, to stand up.',
    tips:
      '• This shifts more emphasis to quads, glutes and adductors vs conventional.\n' +
      '• Hips should be closer to the bar — get your torso upright before pulling.\n' +
      '• Be patient off the floor — sumo is slow to break but fast at lockout.\n' +
      '\n💡 Cue: "Spread the floor apart" with your feet — this fires your glutes and adductors to break the bar off the ground.',
  },
  'trap bar deadlift': {
    url: 'https://www.muscleandstrength.com/exercises/trap-bar-deadlift.html',
    steps:
      '1. Stand inside the trap bar with feet hip-width.\n' +
      '2. Bend down and grip the handles.\n' +
      '3. Brace and drive through your feet to stand up.\n' +
      '4. Lower under control back to the floor.',
    tips:
      '• High handles reduce range of motion (good for beginners); low handles mimic a conventional pull.\n' +
      '• The neutral grip lets you lift heavier with less bicep tear risk.\n' +
      '• Stay centred in the hex — drifting forward turns it into a conventional pull.\n' +
      '\n💡 Cue: "Push the floor away" — think of it as a leg press, not a pull. This keeps your chest up and drives through the quads.',
  },
  'good morning': {
    url: 'https://www.muscleandstrength.com/exercises/good-morning.html',
    steps:
      '1. Place a barbell across your upper back like a squat.\n' +
      '2. With a slight knee bend, hinge forward at the hips.\n' +
      '3. Lower your torso until nearly parallel to the floor.\n' +
      '4. Return to upright by driving your hips forward.',
    tips:
      '• Start very light — this exercise places high demand on the lower back.\n' +
      '• Keep a slight knee bend — don\'t lock out.\n' +
      '• Keep your back flat throughout — if it rounds, reduce depth.\n' +
      '\n💡 Cue: "Push your hips straight back to touch the wall behind you" — the hinge should come from your hips, not by bending your spine.',
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
      '• Avoid using momentum to swing the weight.\n' +
      '\n💡 Cue: Point your toes away from you (plantar flex) — this reduces calf involvement and forces your hamstrings to do more work.',
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
      '• Use a thick barbell pad to avoid hip bruising.\n' +
      '\n💡 Cue: Finish each rep with a posterior pelvic tilt (tuck your tailbone under) — this maximizes glute contraction at the top.',
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
      '• Keep your legs straight to emphasize the gastrocnemius.\n' +
      '\n💡 Cue: At the bottom, let your heels sink as low as possible for a 2-sec stretch — calves grow best from full-range, slow reps.',
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
      '• The hip-flexed position stretches the gastrocnemius more than standing raises.\n' +
      '• Considered one of the best calf exercises by old-school bodybuilders.\n' +
      '• Use a full range of motion — deep stretch at the bottom, hard squeeze on top.\n' +
      '\n💡 Cue: Pause for 2 seconds at the full stretch (bottom) — calves respond best to time under tension, not bouncing.',
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
      '• Retract AND depress your shoulder blades — squeeze them together then pull toward your hips.\n' +
      '• Keep wrists stacked directly over your elbows to protect the joint.\n' +
      '• Bar path is a J-curve: lower to your nipple line, press back toward the rack.\n' +
      '• Tuck elbows to ~45° — never flare to 90°, this protects your shoulders.\n' +
      '• Unrack by pulling the bar out, not pressing it off the hooks. Drive feet into the floor for leg drive.\n' +
      '\n💡 Cue: "Bend the bar" — try to snap it in half as you press. This auto-tucks your elbows and fires your lats for a stable, powerful press.',
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
      '• Bar path should touch low on the chest, near the bottom of your sternum.\n' +
      '• Many lifters feel stronger on decline — the reduced range of motion helps.\n' +
      '\n💡 Cue: "Drive your back into the bench" as you press — this creates a stable platform and prevents your butt from lifting off the pad.',
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
      '• Control the descent — don\'t let gravity pull the weights down.\n' +
      '\n💡 Cue: At the top of each rep, imagine squeezing a pencil between your pecs — this ensures full chest contraction instead of just locking out arms.',
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
      '• A weighted vest is cleaner for heavy sets; plates shift easily without one.\n' +
      '• Keep your body in a plank — don\'t let hips sag or pike up.\n' +
      '• Treat it like a bench press: elbows ~45°, full range of motion.\n' +
      '\n💡 Cue: "Screw your hands into the floor" (externally rotate) — this packs your shoulders and protects the joint, just like on bench.',
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
      '• Don\'t go so deep that your shoulders hurt.\n' +
      '\n💡 Cue: Think about "pushing the bars together" (not just pushing down) — this activates your inner chest like a fly at the top of each rep.',
  },
  'diamond pushup': {
    url: 'https://www.muscleandstrength.com/exercises/diamond-push-ups.html',
    steps:
      '1. Form a diamond shape with your index fingers and thumbs touching the floor.\n' +
      '2. Get into a push-up position with hands under your chest.\n' +
      '3. Lower your chest to your hands.\n' +
      '4. Press back up to full extension.',
    tips:
      '• Primarily targets the triceps — think of it as a bodyweight close-grip bench.\n' +
      '• Keep elbows tracking back along your sides, not flaring out.\n' +
      '• Widen the diamond shape if you feel wrist discomfort.\n' +
      '\n💡 Cue: Lower your chest to your thumbs, not your chin — this keeps elbows tucked and maximizes tricep engagement.',
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
      '• Keep a slight bend in your elbows.\n' +
      '\n💡 Cue: At the squeeze position, try to push your hands together even harder for 1 second — this extra isometric hold maxes out chest fiber recruitment.',
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
      '• Keep the slight elbow bend constant throughout.\n' +
      '\n💡 Cue: Focus on driving the motion from your elbows, not your hands — this keeps tension on the chest and off the front delts.',
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
      '• Great finisher exercise for the chest.\n' +
      '\n💡 Cue: Let your hands cross past each other at the midpoint — the chest continues contracting past midline.',
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
      '• Use an assisted machine or band if you can\'t do bodyweight yet.\n' +
      '\n💡 Cue: "Drive your elbows into your back pockets" — this mental image activates lats instead of just using your biceps.',
  },
  'chin up': {
    url: 'https://www.muscleandstrength.com/exercises/chin-up.html',
    steps:
      '1. Hang from a bar with a supinated (underhand) grip, shoulder-width.\n' +
      '2. Pull yourself up until your chin clears the bar.\n' +
      '3. Squeeze your lats and biceps at the top.\n' +
      '4. Lower all the way to a dead hang.',
    tips:
      '• Supinated grip recruits more biceps, making it easier than pronated pull-ups.\n' +
      '• Full dead hang at the bottom, chin above the bar at the top.\n' +
      '• Keep your core tight and avoid kipping or swinging.\n' +
      '\n💡 Cue: "Pull your chest to the bar, not your chin over it" — this prevents neck craning and ensures your lats do the work through a full range of motion.',
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
      '• Full stretch at the top is important for lat development.\n' +
      '\n💡 Cue: Grip the bar with your ring and pinky fingers tighter than the others — this shifts the pull into your lats and away from your biceps.',
  },
  'neutral pulldown': {
    url: 'https://www.muscleandstrength.com/exercises/close-grip-lat-pull-down.html',
    steps:
      '1. Attach a neutral grip (V-bar or close grip handle) to the cable.\n' +
      '2. Sit down and lean back slightly.\n' +
      '3. Pull the handle to your chest.\n' +
      '4. Extend your arms fully at the top.',
    tips:
      '• Neutral grip is easier on the shoulders and allows a longer range of motion.\n' +
      '• Pull to your sternum, not just your chin — full contraction matters.\n' +
      '• Let your shoulder blades fully depress and retract at the bottom of each rep.\n' +
      '\n💡 Cue: "Drive your elbows into your back pockets" — same cue as pull-ups. If you feel it more in your biceps than your back, lower the weight and focus on this cue.',
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
      '• Squeeze your shoulder blades together at the top.\n' +
      '\n💡 Cue: Think about "rowing to your hip pocket" not to your chest — this keeps your elbows back and engages your lats more.',
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
      '• Can also be done with one hand on a rack for support.\n' +
      '\n💡 Cue: Row to your hip pocket, not your chest — and at the top, think about "putting your elbow in your back pocket" for maximum lat engagement.',
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
      '• Try different attachments for variety (V-bar, wide bar, rope).\n' +
      '\n💡 Cue: At the stretched position, let your shoulder blades fully protract (spread apart) — this extra range of motion adds significant lat stimulus.',
  },
  'chest supported row': {
    url: 'https://www.muscleandstrength.com/exercises/chest-supported-dumbbell-row.html',
    steps:
      '1. Set an incline bench to ~30–45°, lie face down with chest on the pad.\n' +
      '2. Hold dumbbells hanging straight down.\n' +
      '3. Row both dumbbells up, squeezing your shoulder blades.\n' +
      '4. Lower slowly.',
    tips:
      '• Eliminates momentum and spinal loading — pure back isolation.\n' +
      '• Let the dumbbells hang to a full stretch at the bottom before each rep.\n' +
      '• Try different grip angles (neutral, pronated) to hit different back fibers.\n' +
      '\n💡 Cue: "Lead with your elbows, not your hands" — think about driving elbows to the ceiling. This shifts work from biceps to mid-back.',
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
      '• Keep elbows high — at or above shoulder height.\n' +
      '\n💡 Cue: Finish each rep in a "double bicep pose" — externally rotate so your fists point to the ceiling. This trains the rotator cuff, not just rear delts.',
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
      '• Great for rear delt development and shoulder balance.\n' +
      '\n💡 Cue: Lead the motion with the back of your hands (imagine showing someone your knuckles) — this keeps the work in the rear delts instead of the traps.',
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
      '• Full lockout overhead for maximum shoulder development.\n' +
      '\n💡 Cue: "Push your head through the window" once the bar passes your face — getting under the bar activates your shoulders more and creates a stronger lockout.',
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
      '• The rotation hits all three delt heads through one continuous motion.\n' +
      '• Use controlled rotation — don\'t rush it; the transition is where the magic happens.\n' +
      '• Use lighter weight than a standard shoulder press — the rotation adds difficulty.\n' +
      '\n💡 Cue: At the bottom (palms facing you), squeeze your elbows together in front, then rotate and press. This "hug-to-press" path maximizes delt activation.',
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
      '• A slight forward lean can help isolate the side delts more.\n' +
      '\n💡 Cue: Grip the dumbbell with extra pressure on your pinky finger — this tilts the dumbbell like pouring water from a jug and forces your side delt to do the lifting instead of your front delt.',
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
      '• Great for mind-muscle connection with the side delts.\n' +
      '\n💡 Cue: Same as dumbbell version — "pour the water" by leading with your pinky side. With cables, you can also start the rep with slight tension to eliminate momentum.',
  },
  'rear delt fly': {
    url: 'https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html',
    steps:
      '1. Hinge forward with dumbbells hanging below you, slight elbow bend.\n' +
      '2. Raise the dumbbells out to the sides, squeezing your rear delts.\n' +
      '3. Hold at the top briefly.\n' +
      '4. Lower slowly.',
    tips:
      '• Use light weight and focus on the squeeze — rear delts respond to control, not heavy load.\n' +
      '• Lead with your elbows, not your hands, to keep the rear delts working.\n' +
      '• Can also be done seated or face-down on an incline bench for strict form.\n' +
      '\n💡 Cue: "Show your knuckles to the wall behind you" at the top of each rep — this externally rotates and keeps work in your rear delts instead of traps.',
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
      '• The straight bar hits both bicep heads well.\n' +
      '\n💡 Cue: At the top of each rep, try to rotate your pinkies outward (supinate harder) — the biceps are both a flexor and supinator, so this extra twist maximizes the squeeze.',
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
      '• Supinate (twist pinkies outward) at the top for full bicep contraction.\n' +
      '• Keep upper arms pinned — if elbows drift forward, you\'re using momentum.\n' +
      '• Alternating reps let you focus on each arm; simultaneous reps save time.\n' +
      '\n💡 Cue: Start with palms neutral at your sides, then actively rotate as you curl — the twist is where the bicep peak really fires.',
  },
  'hammer curl': {
    url: 'https://www.muscleandstrength.com/exercises/seated-hammer-curl.html',
    steps:
      '1. Hold dumbbells at your sides with a neutral (palms facing in) grip.\n' +
      '2. Curl the weights up keeping palms facing each other the entire time.\n' +
      '3. Squeeze at the top.\n' +
      '4. Lower under control.',
    tips:
      '• Targets the brachialis and brachioradialis — key for overall arm thickness.\n' +
      '• Keep elbows pinned at your sides throughout the movement.\n' +
      '• Cross-body hammer curls (across your chest) emphasize the brachialis more.\n' +
      '\n💡 Cue: "Curl like you\'re hammering a nail" — the neutral grip should stay constant from bottom to top with zero wrist rotation.',
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
      '• Start light to protect your elbows.\n' +
      '\n💡 Cue: Lower the bar slightly behind your head (not to your forehead) — the extra stretch position loads the long head much more effectively.',
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
      '• Great for targeting the lateral head of the triceps.\n' +
      '\n💡 Cue: At the bottom of each rep, actively "twist" the rope outward (spread it apart) and hold for a beat — this extra range hits the lateral head harder.',
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
      '• Cable version provides more constant tension.\n' +
      '\n💡 Cue: Control the eccentric with a 2-3 sec stretch behind your head — the long head of the triceps responds strongly to loaded stretches.',
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
      '• Keep your hips stationary.\n' +
      '\n💡 Cue: Breathe out HARD as you crunch — forceful exhaling automatically contracts your deep abs (transverse abdominis) for a stronger squeeze.',
  },
  'hanging leg raise': {
    url: 'https://www.muscleandstrength.com/exercises/hanging-leg-raise.html',
    steps:
      '1. Hang from a pull-up bar with a slight arm bend.\n' +
      '2. With legs straight (or slightly bent), raise them until parallel or above.\n' +
      '3. Pause at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Curl your pelvis up (posterior tilt) at the top — without this, hip flexors do most of the work.\n' +
      '• Bend knees to make it easier, straighten legs to make it harder.\n' +
      '• Use ab straps if your grip gives out before your abs.\n' +
      '\n💡 Cue: "Bring your belt buckle to your chin" — this forces the pelvic curl that actually works the abs, not just the hip flexors.',
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
      '• An anti-rotation exercise — your core resists the cable pulling you sideways.\n' +
      '• Keep hips and shoulders square to the front throughout each rep.\n' +
      '• Hold the pressed-out position for 2-3 seconds for extra time under tension.\n' +
      '\n💡 Cue: "Brace like someone is about to push you from the side" — this activates your obliques and deep core stabilizers, not just your rectus abdominis.',
  },

  /* ═══════ NEW EXERCISES ═══════ */
  'ab crunch machine': {
    url: 'https://www.muscleandstrength.com/exercises/ab-crunch-machine.html',
    steps:
      '1. Sit in the machine with your back against the pad and grab the handles.\n' +
      '2. Select your weight and place your feet under the foot pads.\n' +
      '3. Crunch forward by contracting your abs, bringing your chest toward your knees.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• Don\'t pull with your arms — the motion comes from your abs.\n' +
      '• Exhale forcefully as you crunch for a harder contraction.\n' +
      '• Use a controlled 2-sec eccentric — don\'t let the weight stack slam.\n' +
      '\n💡 Cue: Think of \"curling your ribcage toward your belly button\" — not just bending forward. The spine should round, not just hinge at the hips.',
  },
  'cable bicep curl': {
    url: 'https://www.muscleandstrength.com/exercises/cable-bicep-curl.html',
    steps:
      '1. Attach a straight bar or EZ bar to a low cable.\n' +
      '2. Stand facing the machine, grab the handle with an underhand grip.\n' +
      '3. Curl the handle up toward your shoulders, keeping elbows pinned.\n' +
      '4. Lower under control.',
    tips:
      '• Cable provides constant tension — no rest at the top or bottom.\n' +
      '• Keep your elbows at your sides, not drifting forward.\n' +
      '• Try a rope attachment for a neutral grip variation.\n' +
      '\n💡 Cue: Squeeze your pinkies inward at the top (supinate harder) — this engages the bicep peak more than just bending your elbows.',
  },
  'cable tricep kickback': {
    url: 'https://www.muscleandstrength.com/exercises/cable-tricep-kickback.html',
    steps:
      '1. Set a cable to knee height, grab the handle with one hand.\n' +
      '2. Hinge forward and pin your upper arm to your side.\n' +
      '3. Extend your arm straight back, squeezing your tricep.\n' +
      '4. Return slowly. Switch arms.',
    tips:
      '• Cable version is superior to dumbbells because tension is constant throughout.\n' +
      '• Keep your upper arm completely still — only the forearm moves.\n' +
      '• Use a light weight and really squeeze for 1 second at full extension.\n' +
      '\n💡 Cue: At the top, try to turn your pinky outward slightly — this extra twist hits the lateral head of the tricep harder.',
  },
  'cable woodchop': {
    url: 'https://www.muscleandstrength.com/exercises/cable-woodchop.html',
    steps:
      '1. Set a cable to the highest position. Stand sideways to the machine.\n' +
      '2. Grip the handle with both hands, arms extended.\n' +
      '3. Rotate your torso and pull the handle diagonally down across your body.\n' +
      '4. Return under control. Do all reps, then switch sides.',
    tips:
      '• Power comes from your core rotation, not your arms.\n' +
      '• Keep your arms relatively straight — they\'re just connecting you to the cable.\n' +
      '• Can also be done low-to-high for a different angle.\n' +
      '\n💡 Cue: Pivot through your hips and feet — your whole body should rotate as a unit. If only your arms are moving, the weight is too heavy.',
  },
  'cable pull through': {
    url: 'https://www.muscleandstrength.com/exercises/cable-pull-through.html',
    steps:
      '1. Set a cable to the lowest position with a rope attachment.\n' +
      '2. Face away from the machine, straddle the cable, grab the rope between your legs.\n' +
      '3. Hinge forward at the hips, letting the cable pull you back.\n' +
      '4. Drive your hips forward to stand tall, squeezing your glutes.',
    tips:
      '• This is a hip hinge — not a squat. Push your hips back.\n' +
      '• Great for learning the deadlift/RDL hip hinge pattern.\n' +
      '• Keep your back flat and core braced throughout.\n' +
      '\n💡 Cue: At the top, finish with a strong glute squeeze and a posterior pelvic tilt (tuck tailbone) — same cue as hip thrusts.',
  },
  'hip adduction machine': {
    url: 'https://www.muscleandstrength.com/exercises/hip-adduction-machine.html',
    steps:
      '1. Sit in the machine with your back against the pad.\n' +
      '2. Place your legs against the outer pads, spread apart.\n' +
      '3. Squeeze your legs together against resistance.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• The opposite of hip abduction — this targets your inner thighs.\n' +
      '• Use a controlled tempo — don\'t let the weight stack slam.\n' +
      '• Leaning forward slightly can change which part of the adductors is emphasized.\n' +
      '\n💡 Cue: At the squeezed position, hold for 1-2 seconds — adductors respond very well to time under tension and isometric holds.',
  },
  'glute kickback machine': {
    url: 'https://www.muscleandstrength.com/exercises/glute-kickback-machine.html',
    steps:
      '1. Stand on the platform and place one foot against the push pad.\n' +
      '2. Hold the handles for balance.\n' +
      '3. Push the pad back by extending your hip, squeezing your glute.\n' +
      '4. Return slowly. Complete reps and switch legs.',
    tips:
      '• Keep your back neutral — don\'t arch to push the weight.\n' +
      '• Squeeze your glute hard at full extension and hold briefly.\n' +
      '• Great for glute isolation without loading the spine.\n' +
      '\n💡 Cue: Push through your heel, not the ball of your foot — this shifts the work from your hamstring into your glute.',
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

  /* ═══════ ADDITIONAL CORE / ABS ═══════ */
  'crunch': {
    url: 'https://www.muscleandstrength.com/exercises/crunches.html',
    steps:
      '1. Lie on your back with knees bent, feet flat on the floor.\n' +
      '2. Place your hands behind your head or across your chest.\n' +
      '3. Curl your shoulders off the floor by contracting your abs.\n' +
      '4. Lower slowly back to the starting position.',
    tips:
      '• Don\'t pull on your neck — let your abs do the work.\n' +
      '• Exhale forcefully as you crunch for a deeper contraction.\n' +
      '• Only lift your shoulder blades off the floor — it\'s a small motion.\n' +
      '\n💡 Cue: "Shorten the distance between your ribs and your hips" — this mental image keeps the work in your abs and prevents neck strain.',
  },
  'decline crunch': {
    url: 'https://www.muscleandstrength.com/exercises/decline-crunch.html',
    steps:
      '1. Lie on a decline bench with your feet hooked under the pads.\n' +
      '2. Cross your arms over your chest or place hands behind your head.\n' +
      '3. Crunch up by curling your torso toward your knees.\n' +
      '4. Lower slowly under control.',
    tips:
      '• The decline adds resistance compared to a flat crunch.\n' +
      '• Don\'t sit all the way up — focus on curling your spine.\n' +
      '• Hold a weight plate at your chest for added resistance.',
  },
  'reverse crunch': {
    url: 'https://www.muscleandstrength.com/exercises/reverse-crunch.html',
    steps:
      '1. Lie on your back with arms at your sides, knees bent 90°.\n' +
      '2. Curl your hips off the floor by contracting your lower abs.\n' +
      '3. Bring your knees toward your chest, lifting your tailbone.\n' +
      '4. Lower slowly back to the start.',
    tips:
      '• Focus on curling your pelvis, not just swinging your legs.\n' +
      '• Keep the motion slow and controlled — no momentum.\n' +
      '• Great for targeting the lower portion of the rectus abdominis.\n' +
      '\n💡 Cue: "Tilt your pelvis toward the ceiling" — this ensures your abs are doing the work instead of your hip flexors.',
  },
  'lying leg raise': {
    url: 'https://www.muscleandstrength.com/exercises/lying-floor-leg-raise.html',
    steps:
      '1. Lie flat on your back with legs straight, hands under your hips for support.\n' +
      '2. Keeping legs straight, raise them until perpendicular to the floor.\n' +
      '3. Pause briefly at the top.\n' +
      '4. Lower slowly without letting your feet touch the floor.',
    tips:
      '• Press your lower back into the floor throughout — if it arches, bend your knees slightly.\n' +
      '• Hands under your hips helps maintain a neutral spine.\n' +
      '• To make it harder, add a hip curl at the top (lift tailbone off the floor).',
  },
  'captain chair leg raise': {
    url: 'https://www.muscleandstrength.com/exercises/captain-chair-leg-raise.html',
    steps:
      '1. Position yourself in the captain\'s chair with arms on the pads, back against the support.\n' +
      '2. Let your legs hang straight down.\n' +
      '3. Raise your knees (or straight legs) toward your chest.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Curl your pelvis at the top for maximum ab engagement.\n' +
      '• Keep your back pressed against the pad — don\'t swing.\n' +
      '• Straight legs are harder; bent knees are easier.\n' +
      '\n💡 Cue: Think "knees to chest, not feet to face" — this forces the posterior pelvic tilt that makes the exercise effective.',
  },
  'bicycle crunch': {
    url: 'https://www.muscleandstrength.com/exercises/bicycle-crunch.html',
    steps:
      '1. Lie on your back with hands behind your head, legs raised and knees at 90°.\n' +
      '2. Bring your right elbow toward your left knee while extending your right leg.\n' +
      '3. Switch sides in a pedaling motion.\n' +
      '4. Continue alternating for the prescribed reps.',
    tips:
      '• Don\'t just twist your arms — rotate your entire torso.\n' +
      '• Keep the motion controlled — faster isn\'t better.\n' +
      '• Fully extend each leg on the outward phase for full range of motion.',
  },
  'dead bug': {
    url: 'https://www.muscleandstrength.com/exercises/dead-bug.html',
    steps:
      '1. Lie on your back with arms extended toward the ceiling, knees at 90°.\n' +
      '2. Slowly lower your right arm behind your head while extending your left leg.\n' +
      '3. Return to the start, then repeat on the opposite side.\n' +
      '4. Continue alternating.',
    tips:
      '• Press your lower back into the floor the entire time — no arching.\n' +
      '• Move slowly and with control — this is an anti-extension exercise.\n' +
      '• Great for learning core bracing and coordination.\n' +
      '\n💡 Cue: "Flatten your back like you\'re squishing a grape under your spine" — if your lower back lifts off the floor, reduce the range of motion.',
  },
  'v up': {
    url: 'https://www.muscleandstrength.com/exercises/v-up.html',
    steps:
      '1. Lie flat on your back, arms extended overhead, legs straight.\n' +
      '2. Simultaneously raise your legs and torso, reaching your hands toward your toes.\n' +
      '3. Your body should form a V shape at the top.\n' +
      '4. Lower slowly back to the starting position.',
    tips:
      '• Keep your legs as straight as possible throughout.\n' +
      '• If it\'s too hard, start with tuck-ups (knees bent).\n' +
      '• Control the descent — don\'t just fall back to the floor.',
  },
  'russian twist': {
    url: 'https://www.muscleandstrength.com/exercises/russian-twist.html',
    steps:
      '1. Sit on the floor with knees bent, feet elevated slightly, torso leaned back ~45°.\n' +
      '2. Hold a weight plate or dumbbell at chest height.\n' +
      '3. Rotate your torso to one side, tapping the weight near the floor.\n' +
      '4. Rotate to the other side. Continue alternating.',
    tips:
      '• Feet off the floor makes it harder; feet on the floor makes it easier.\n' +
      '• Rotate through your entire torso, not just your arms.\n' +
      '• Start with bodyweight before adding load.',
  },
  'dragon flag': {
    url: 'https://www.muscleandstrength.com/exercises/dragon-flag.html',
    steps:
      '1. Lie on a bench and grip the edges behind your head.\n' +
      '2. Raise your entire body (from shoulders to toes) into a straight line.\n' +
      '3. Slowly lower your body as a rigid plank toward the bench.\n' +
      '4. Stop before your lower back touches and reverse the movement.',
    tips:
      '• An advanced exercise — start with negatives (lowering only) if needed.\n' +
      '• Your body should stay in a straight line — don\'t pike at the hips.\n' +
      '• Only your upper back/shoulders should remain on the bench.\n' +
      '\n💡 Cue: "Squeeze every muscle from chest to toes" before lowering — total body tension is what makes this work.',
  },
  'decline situp': {
    url: 'https://www.muscleandstrength.com/exercises/decline-sit-up.html',
    steps:
      '1. Secure your feet on a decline bench.\n' +
      '2. Cross arms over your chest or hold a weight plate.\n' +
      '3. Lower your torso under control until your back is just above the bench.\n' +
      '4. Sit back up by contracting your abs.',
    tips:
      '• Maintain a slight round in your upper back — don\'t go with a flat back.\n' +
      '• Don\'t use momentum to swing up.\n' +
      '• Add weight plate for progressive overload once bodyweight is easy.',
  },
  'mountain climber': {
    url: 'https://www.muscleandstrength.com/exercises/mountain-climbers.html',
    steps:
      '1. Get into a high plank position with hands under your shoulders.\n' +
      '2. Drive one knee toward your chest.\n' +
      '3. Quickly switch legs, driving the other knee forward.\n' +
      '4. Continue alternating at the prescribed pace.',
    tips:
      '• Keep your hips level — don\'t let them bounce up and down.\n' +
      '• The faster you go, the more it becomes a conditioning exercise.\n' +
      '• Slow, controlled reps emphasize core stability.',
  },

  /* ═══════ ADDITIONAL CABLE EXERCISES ═══════ */
  'cable upright row': {
    url: 'https://www.muscleandstrength.com/exercises/cable-upright-row.html',
    steps:
      '1. Attach a straight bar or rope to a low cable.\n' +
      '2. Stand upright, grip the handle with hands close together.\n' +
      '3. Pull the handle up along your body to chin height, leading with your elbows.\n' +
      '4. Lower under control.',
    tips:
      '• Lead with elbows, not hands — elbows should always be higher than your wrists.\n' +
      '• Don\'t go above chin height if you feel shoulder impingement.\n' +
      '• Rope attachment lets you flare elbows out for more side delt emphasis.\n' +
      '\n💡 Cue: "Pull your elbows to the ceiling" — this keeps the tension on your delts and traps rather than your biceps.',
  },
  'cable reverse fly': {
    url: 'https://www.muscleandstrength.com/exercises/cable-reverse-fly.html',
    steps:
      '1. Set cables to shoulder height with no attachment (use the ball stops) or single handles.\n' +
      '2. Cross the cables — grab the left cable with your right hand and vice versa.\n' +
      '3. Step back, arms crossed in front of you, slight elbow bend.\n' +
      '4. Pull your arms apart in a reverse fly motion, squeezing your rear delts.',
    tips:
      '• Keep a slight bend in your elbows throughout.\n' +
      '• Constant cable tension makes this superior to dumbbells for rear delts.\n' +
      '• Control the return — don\'t let the cables snap back.',
  },
  'cable front raise': {
    url: 'https://www.muscleandstrength.com/exercises/cable-front-raise.html',
    steps:
      '1. Stand facing away from a low cable, handle in one hand.\n' +
      '2. With a slight elbow bend, raise your arm straight in front to shoulder height.\n' +
      '3. Pause briefly at the top.\n' +
      '4. Lower slowly. Complete all reps, then switch arms.',
    tips:
      '• Cable behind you provides resistance through the full range.\n' +
      '• Don\'t swing — keep the movement strict and controlled.\n' +
      '• Use light weight — front delts fatigue quickly.',
  },
  'cable overhead curl': {
    url: 'https://www.muscleandstrength.com/exercises/overhead-cable-curl.html',
    steps:
      '1. Set cables to the highest position with single handles.\n' +
      '2. Stand in the center, grab both handles with palms up.\n' +
      '3. Curl the handles toward your ears, keeping upper arms level.\n' +
      '4. Extend slowly back to the start.',
    tips:
      '• The arms-up position targets the bicep peak (short head).\n' +
      '• Keep upper arms parallel to the floor throughout.\n' +
      '• Great finisher — use lighter weight and squeeze hard.\n' +
      '\n💡 Cue: Think of hitting a "front double bicep" pose at the end of each rep — hold the squeeze for a full second.',
  },
  'cable hammer curl': {
    url: 'https://www.muscleandstrength.com/exercises/cable-rope-hammer-curl.html',
    steps:
      '1. Attach a rope to a low cable.\n' +
      '2. Stand facing the machine, grab the rope with a neutral grip.\n' +
      '3. Curl the rope toward your shoulders, keeping palms facing each other.\n' +
      '4. Lower under control.',
    tips:
      '• The cable keeps constant tension — no rest at the top or bottom.\n' +
      '• Keep elbows pinned at your sides.\n' +
      '• At the top, try to pull the rope apart slightly for extra brachialis activation.',
  },
  'single arm cable row': {
    url: 'https://www.muscleandstrength.com/exercises/one-arm-cable-row.html',
    steps:
      '1. Set a cable to about waist height with a single handle.\n' +
      '2. Step back, hinge slightly, and grab the handle with one hand.\n' +
      '3. Row the handle to your hip, squeezing your lat.\n' +
      '4. Extend slowly. Complete all reps, then switch sides.',
    tips:
      '• Unilateral work helps fix muscle imbalances.\n' +
      '• Let your shoulder blade protract (reach forward) at the stretch for extra ROM.\n' +
      '• Keep your hips square — don\'t rotate to cheat the weight.\n' +
      '\n💡 Cue: "Row to your hip pocket, not your chest" — this ensures your lats do the work instead of your upper traps.',
  },
  'cable shrug': {
    url: 'https://www.muscleandstrength.com/exercises/cable-shrug.html',
    steps:
      '1. Stand between two low cables or facing a single cable with a bar attachment.\n' +
      '2. Grip the handles/bar at arm\'s length.\n' +
      '3. Shrug your shoulders straight up toward your ears.\n' +
      '4. Hold briefly, then lower slowly.',
    tips:
      '• Cable provides constant tension unlike dumbbells/barbells.\n' +
      '• Straight up and down — don\'t roll your shoulders.\n' +
      '• Hold the top contraction for 2 seconds for better trap activation.',
  },
  'cable external rotation': {
    url: 'https://www.muscleandstrength.com/exercises/cable-external-rotation.html',
    steps:
      '1. Set a cable to elbow height. Stand sideways to the machine.\n' +
      '2. Grab the handle with the far hand, elbow at 90° pinned to your side.\n' +
      '3. Rotate your forearm outward away from your body.\n' +
      '4. Return slowly. Complete all reps, then switch sides.',
    tips:
      '• Use very light weight — this is a rehab/prehab exercise.\n' +
      '• Keep your elbow glued to your side throughout.\n' +
      '• Essential for shoulder health, especially for heavy pressers.\n' +
      '\n💡 Cue: Tuck a rolled towel between your elbow and torso — if it drops, your elbow is moving too much.',
  },
  'cable internal rotation': {
    url: 'https://www.muscleandstrength.com/exercises/cable-internal-rotation.html',
    steps:
      '1. Set a cable to elbow height. Stand sideways to the machine.\n' +
      '2. Grab the handle with the near hand, elbow at 90° pinned to your side.\n' +
      '3. Rotate your forearm inward across your body.\n' +
      '4. Return slowly. Complete all reps, then switch sides.',
    tips:
      '• Use very light weight — this is a prehab/rehab movement.\n' +
      '• Keep your elbow fixed at your side the entire time.\n' +
      '• Pair with external rotation for balanced rotator cuff training.',
  },
  'cable ab crunch (standing)': {
    url: 'https://www.muscleandstrength.com/exercises/standing-cable-crunch.html',
    steps:
      '1. Attach a rope to a high cable. Stand facing the machine.\n' +
      '2. Hold the rope behind your head with both hands.\n' +
      '3. Crunch your torso forward by flexing your abs.\n' +
      '4. Return to upright under control.',
    tips:
      '• Don\'t pull with your arms — the motion comes from your abs.\n' +
      '• Exhale hard as you crunch for a deeper contraction.\n' +
      '• Standing version is less intense than kneeling — good for beginners.',
  },

  /* ═══════ ADDITIONAL DIP VARIATIONS ═══════ */
  'weighted dip': {
    url: 'https://www.muscleandstrength.com/exercises/weighted-dip.html',
    steps:
      '1. Attach weight using a dip belt, weighted vest, or dumbbell between your feet.\n' +
      '2. Grip the parallel bars and lift yourself to full extension.\n' +
      '3. Lower by bending your elbows until shoulders are below elbows.\n' +
      '4. Press back up to full lockout.',
    tips:
      '• Lean forward for chest emphasis; stay upright for triceps.\n' +
      '• Progress gradually — even small weight jumps feel significant on dips.\n' +
      '• Don\'t go so deep that your shoulders protest.\n' +
      '\n💡 Cue: "Push the bars together" at the top — this isometric squeeze activates inner chest fibers like a fly.',
  },
  'tricep dip': {
    url: 'https://www.muscleandstrength.com/exercises/bench-dip.html',
    steps:
      '1. Place your hands on a bench behind you, fingers forward.\n' +
      '2. Extend your legs out in front (or bend knees to make it easier).\n' +
      '3. Lower your body by bending your elbows until they\'re at ~90°.\n' +
      '4. Press back up to full extension.',
    tips:
      '• Keep your back close to the bench — don\'t drift forward.\n' +
      '• Elevate your feet on another bench to increase difficulty.\n' +
      '• Stop if you feel shoulder pain — this position can be stressful on the joint.',
  },
  'machine dip': {
    url: 'https://www.muscleandstrength.com/exercises/machine-dip.html',
    steps:
      '1. Sit in the machine with your back against the pad.\n' +
      '2. Grip the handles at your sides.\n' +
      '3. Press the handles down by extending your arms.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• The machine stabilizes the movement — great for isolating the press pattern.\n' +
      '• On an assisted version, more weight = more help (counterweight).\n' +
      '• Good stepping stone toward bodyweight and weighted dips.',
  },
  'ring dip': {
    url: 'https://www.muscleandstrength.com/exercises/ring-dip.html',
    steps:
      '1. Grip the rings and press yourself up to full arm extension (support hold).\n' +
      '2. Turn the rings out slightly (RTO) at the top.\n' +
      '3. Lower by bending your elbows, keeping rings close to your body.\n' +
      '4. Press back up to full lockout.',
    tips:
      '• Much harder than bar dips — the instability forces stabilizer muscles to work.\n' +
      '• Master a solid support hold before attempting reps.\n' +
      '• Keep the rings tight to your sides throughout.\n' +
      '\n💡 Cue: "Crush the rings into your sides" — this engages your lats and stabilizes the movement.',
  },

  /* ═══════ ADDITIONAL MACHINE EXERCISES ═══════ */
  'machine chest press': {
    url: 'https://www.muscleandstrength.com/exercises/machine-chest-press.html',
    steps:
      '1. Sit with your back flat against the pad, grab the handles at chest height.\n' +
      '2. Set the seat height so handles align with your mid-chest.\n' +
      '3. Press the handles forward until arms are fully extended.\n' +
      '4. Return slowly to the starting position.',
    tips:
      '• Great for chest isolation without needing to balance the weight.\n' +
      '• Perfect for dropsets and high-rep burnout work.\n' +
      '• Keep your shoulder blades pinched back for maximum chest engagement.',
  },
  'machine shoulder press': {
    url: 'https://www.muscleandstrength.com/exercises/machine-shoulder-press.html',
    steps:
      '1. Sit with your back against the pad, grab the handles at shoulder height.\n' +
      '2. Press the handles overhead until your arms are fully extended.\n' +
      '3. Lower to the starting position under control.\n' +
      '4. Repeat.',
    tips:
      '• Machine stabilizes the path — great for shoulder isolation.\n' +
      '• Adjust the seat so handles start at ear level.\n' +
      '• Don\'t arch your lower back — keep it pressed against the pad.',
  },
  'machine lat pulldown': {
    url: 'https://www.muscleandstrength.com/exercises/machine-lat-pulldown.html',
    steps:
      '1. Sit at the plate-loaded or lever pulldown machine.\n' +
      '2. Grip the handles above you.\n' +
      '3. Pull the handles down until your elbows are at your sides.\n' +
      '4. Return slowly to a full stretch.',
    tips:
      '• Plate-loaded version often has a smoother strength curve than cable.\n' +
      '• Focus on driving elbows down, not pulling with your hands.\n' +
      '• Full stretch at the top is essential — don\'t short the range of motion.',
  },
  'machine row': {
    url: 'https://www.muscleandstrength.com/exercises/machine-row.html',
    steps:
      '1. Sit at the machine with your chest against the pad.\n' +
      '2. Grip the handles with arms extended.\n' +
      '3. Pull the handles back, squeezing your shoulder blades together.\n' +
      '4. Return slowly to the stretched position.',
    tips:
      '• Chest pad eliminates momentum — great for strict back work.\n' +
      '• Try different grip options if the machine offers them (wide, neutral, close).\n' +
      '• Let your shoulders fully protract at the stretch for extra range of motion.',
  },
  'machine preacher curl': {
    url: 'https://www.muscleandstrength.com/exercises/machine-preacher-curl.html',
    steps:
      '1. Sit at the machine, place your upper arms on the pad.\n' +
      '2. Grip the handles with an underhand grip.\n' +
      '3. Curl up, squeezing your biceps at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• Machine keeps constant tension — no dead spots at top or bottom.\n' +
      '• Excellent for dropsets and high-rep finishers.\n' +
      '• Adjust the seat so your armpits rest at the top of the pad.',
  },
  'seated row machine': {
    url: 'https://www.muscleandstrength.com/exercises/seated-row-machine.html',
    steps:
      '1. Sit on the machine and place your chest against the pad.\n' +
      '2. Grip the handles with arms extended.\n' +
      '3. Row the handles back, squeezing your shoulder blades.\n' +
      '4. Return to the starting position slowly.',
    tips:
      '• Similar to a cable row but with a fixed path — easier to isolate the back.\n' +
      '• Keep your chest on the pad throughout — don\'t lean back.\n' +
      '• A great option for beginners or for finishing back workouts.',
  },

  /* ═══════ ADDITIONAL BARBELL / DUMBBELL / BODYWEIGHT ═══════ */
  'close grip bench press': {
    url: 'https://www.muscleandstrength.com/exercises/close-grip-bench-press.html',
    steps:
      '1. Lie on a flat bench, grip the bar with hands about shoulder-width apart.\n' +
      '2. Unrack and lower the bar to your lower chest, keeping elbows tight to your body.\n' +
      '3. Press back up to full lockout.\n' +
      '4. Keep your elbows tucked throughout.',
    tips:
      '• Hands should be shoulder-width — going too narrow stresses the wrists.\n' +
      '• Elbows stay tight to your sides, not flared.\n' +
      '• Great for both tricep strength and improving your bench lockout.\n' +
      '\n💡 Cue: "Squeeze the bar like you\'re trying to break it" — this activates your triceps from the start and keeps elbows tucked naturally.',
  },
  'incline cable fly': {
    url: 'https://www.muscleandstrength.com/exercises/incline-cable-fly.html',
    steps:
      '1. Set an incline bench (30-45°) between two low cables.\n' +
      '2. Grab the handles, lie back with arms extended, slight elbow bend.\n' +
      '3. Bring your hands together above your upper chest in an arc.\n' +
      '4. Lower slowly back to the stretched position.',
    tips:
      '• Targets the upper chest with constant cable tension.\n' +
      '• Keep the slight elbow bend constant — don\'t straighten or bend further.\n' +
      '• Great finisher after heavy incline pressing.',
  },
  'dumbbell rdl': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-romanian-deadlift.html',
    steps:
      '1. Stand with feet hip-width, holding dumbbells in front of your thighs.\n' +
      '2. Hinge at the hips, pushing them back while lowering the dumbbells.\n' +
      '3. Go as low as your hamstring flexibility allows, keeping your back flat.\n' +
      '4. Drive your hips forward to stand back up.',
    tips:
      '• Keep the dumbbells close to your legs throughout.\n' +
      '• Feel the stretch in your hamstrings — that\'s the target.\n' +
      '• Great alternative when barbells are unavailable or for higher-rep work.\n' +
      '\n💡 Cue: Same as barbell RDL — "slide the dumbbells down your legs like they\'re on rails." This keeps the load close and protects your back.',
  },
  'reverse lunge': {
    url: 'https://www.muscleandstrength.com/exercises/reverse-lunge.html',
    steps:
      '1. Stand tall with dumbbells at your sides (or barbell on your back).\n' +
      '2. Step backward with one foot and lower until both knees are at ~90°.\n' +
      '3. Push through your front foot to return to standing.\n' +
      '4. Repeat on the other side or alternate.',
    tips:
      '• Easier on the knees than forward lunges — less shear force.\n' +
      '• Keep your torso upright throughout.\n' +
      '• The front leg does most of the work — focus on driving through the heel.',
  },
  'lateral lunge': {
    url: 'https://www.muscleandstrength.com/exercises/dumbbell-side-lunge.html',
    steps:
      '1. Stand with feet together, holding a dumbbell at your chest or dumbbells at your sides.\n' +
      '2. Take a wide step to one side, sitting your hips back.\n' +
      '3. Keep the trailing leg straight as you lower into the lunge.\n' +
      '4. Push off the bent leg to return to the starting position.',
    tips:
      '• Great for hip mobility and adductor flexibility.\n' +
      '• Keep your chest up and hips pushed back.\n' +
      '• The deeper you go, the more your glutes and adductors work.',
  },
  'sissy squat': {
    url: 'https://www.muscleandstrength.com/exercises/sissy-squat.html',
    steps:
      '1. Stand upright, holding a rack or pole for balance.\n' +
      '2. Rise onto your toes, then lean your torso back while bending your knees.\n' +
      '3. Lower until your knees are well in front of your toes and your thighs burn.\n' +
      '4. Drive through your toes to return to the start.',
    tips:
      '• Extreme quad isolation — not for those with knee issues.\n' +
      '• A sissy squat machine makes balance much easier.\n' +
      '• Start with bodyweight only and progress slowly.\n' +
      '\n💡 Cue: "Push your knees as far forward as possible" — this is the opposite of a normal squat cue, but it\'s what makes the exercise work.',
  },
  'land mine press': {
    url: 'https://www.muscleandstrength.com/exercises/landmine-press.html',
    steps:
      '1. Wedge one end of a barbell into a corner or landmine attachment.\n' +
      '2. Hold the other end at shoulder height with one or both hands.\n' +
      '3. Press the bar up and forward until your arm is fully extended.\n' +
      '4. Lower under control.',
    tips:
      '• The angled path is often more shoulder-friendly than a straight overhead press.\n' +
      '• One arm at a time works the core as an anti-rotation stabilizer.\n' +
      '• Great for athletes who need pressing power without full overhead range.',
  },
  'incline hammer curl': {
    url: 'https://www.muscleandstrength.com/exercises/incline-hammer-curl.html',
    steps:
      '1. Sit on an incline bench (45-60°) with dumbbells hanging at your sides.\n' +
      '2. Curl the weights up with a neutral (palms facing each other) grip.\n' +
      '3. Squeeze your biceps at the top.\n' +
      '4. Lower slowly.',
    tips:
      '• The incline pre-stretches the biceps — more range of motion than standing.\n' +
      '• Keep your back flat against the bench — don\'t lean forward.\n' +
      '• Start lighter than your standing hammer curl weight.',
  },
  'spider curl': {
    url: 'https://www.muscleandstrength.com/exercises/spider-curl.html',
    steps:
      '1. Lie face down on an incline bench (45°) with your arms hanging straight down.\n' +
      '2. Hold dumbbells or an EZ bar with an underhand grip.\n' +
      '3. Curl the weight up, squeezing your biceps hard at the top.\n' +
      '4. Lower slowly under control.',
    tips:
      '• The prone position eliminates all momentum — pure bicep contraction.\n' +
      '• Gravity provides maximum tension at the fully contracted position.\n' +
      '• Great for building the bicep peak.\n' +
      '\n💡 Cue: "Squeeze like you\'re crushing a walnut in your elbow crease" at the top — the prone position makes the peak contraction brutally effective.',
  },
  'smith machine bench press': {
    url: 'https://www.muscleandstrength.com/exercises/smith-machine-bench-press.html',
    steps:
      '1. Position a flat bench under the Smith machine bar.\n' +
      '2. Lie on the bench, grip the bar slightly wider than shoulder-width.\n' +
      '3. Unrack and lower the bar to your mid-chest.\n' +
      '4. Press back up to lockout.',
    tips:
      '• The fixed path lets you focus on chest contraction without stabilization demands.\n' +
      '• Great for training to failure safely without a spotter.\n' +
      '• Slightly different muscle activation than free-weight bench — use as a supplement, not a replacement.',
  },
  'smith machine incline bench': {
    url: 'https://www.muscleandstrength.com/exercises/smith-machine-incline-bench-press.html',
    steps:
      '1. Set an incline bench (30-45°) under the Smith machine.\n' +
      '2. Grip the bar slightly wider than shoulder-width.\n' +
      '3. Lower the bar to your upper chest / collarbone area.\n' +
      '4. Press back up to lockout.',
    tips:
      '• Fixed path lets you isolate the upper chest safely.\n' +
      '• Great for high-rep hypertrophy sets or dropsets.\n' +
      '• Adjust bench position so the bar path hits your upper chest naturally.',
  },

  /* ═══════ FOREARMS ═══════ */
  'wrist curl': {
    url: 'https://www.muscleandstrength.com/exercises/wrist-curl.html',
    steps:
      '1. Sit on a bench, forearms on your thighs or the bench, palms up.\n' +
      '2. Hold a barbell or dumbbells, letting your wrists hang over the edge.\n' +
      '3. Curl the weight up by flexing your wrists.\n' +
      '4. Lower slowly back down.',
    tips:
      '• Use 15-25 rep ranges — forearms respond to high volume.\n' +
      '• Let the bar roll to your fingertips at the bottom for extra range of motion.\n' +
      '• Don\'t use heavy weight — forearm tendons are delicate.',
  },
  'reverse wrist curl': {
    url: 'https://www.muscleandstrength.com/exercises/reverse-wrist-curl.html',
    steps:
      '1. Sit on a bench, forearms on your thighs, palms facing down.\n' +
      '2. Hold a barbell or dumbbells, wrists hanging over the edge.\n' +
      '3. Extend your wrists upward.\n' +
      '4. Lower slowly.',
    tips:
      '• Targets the wrist extensors — important for balanced forearm development.\n' +
      '• Use lighter weight than regular wrist curls.\n' +
      '• Helps prevent conditions like tennis elbow.',
  },

  /* ═══════ ASSISTED EXERCISES ═══════ */
  'assisted pull up': {
    url: 'https://www.muscleandstrength.com/exercises/machine-assisted-pull-up.html',
    steps:
      '1. Select a counterweight — more weight means more assistance.\n' +
      '2. Step or kneel onto the platform, grip the bar overhand (wider than shoulder-width).\n' +
      '3. Pull yourself up until your chin clears the bar.\n' +
      '4. Lower slowly to a full stretch.',
    tips:
      '• Reduce the counterweight over time as you get stronger.\n' +
      '• Use the same form as a regular pull-up — drive elbows down and back.\n' +
      '• Great stepping stone to unassisted pull-ups.\n' +
      '\n💡 Cue: "Drive your elbows into your back pockets" — same cue as a real pull-up. The machine just takes off some bodyweight.',
  },
  'assisted chin up': {
    url: 'https://www.muscleandstrength.com/exercises/machine-assisted-chin-up.html',
    steps:
      '1. Select a counterweight — more weight means more assistance.\n' +
      '2. Step or kneel onto the platform, grip the bar underhand (shoulder-width).\n' +
      '3. Pull yourself up until your chin clears the bar.\n' +
      '4. Lower slowly to a full stretch.',
    tips:
      '• Supinated (underhand) grip recruits more biceps than a pull-up.\n' +
      '• Reduce assist over time — track progress in the app.\n' +
      '• Master 10+ reps at the lightest assistance before trying unassisted.\n' +
      '\n💡 Cue: "Pull your chest to the bar, not your chin over it" — prevents neck craning and ensures your lats work through the full range.',
  },
  'assisted dip': {
    url: 'https://www.muscleandstrength.com/exercises/machine-assisted-dip.html',
    steps:
      '1. Select a counterweight — more weight means more assistance.\n' +
      '2. Step or kneel onto the platform, grip the parallel bars.\n' +
      '3. Lower by bending your elbows until shoulders are below elbows.\n' +
      '4. Press back up to full lockout.',
    tips:
      '• Lean forward for more chest; stay upright for more triceps.\n' +
      '• Reduce counterweight progressively as you build strength.\n' +
      '• Once you can handle the lightest setting easily, graduate to bodyweight dips.\n' +
      '\n💡 Cue: Same rules as regular dips — "push the bars together" at the top for maximum chest activation.',
  },
};
