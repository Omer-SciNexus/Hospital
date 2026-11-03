Below is a full image prompt kit for your OpenAI image generation. It has a shared style block for consistency, each image's file name and folder, and the right size for each.

0. Rules for all images
Settings in OpenAI (gpt-image):

Image type	Size	Background	Quality
Hero / banners / wide scenes	1536x1024 (landscape)	opaque	high
Doctor portraits, auth side panel	1024x1536 (portrait)	opaque	high
Icons, products, category tiles	1024x1024	transparent	high
Tips

Never ask for text in images. AI renders text badly, so all headings and prices go in the HTML.
No real brand logos. All packaging stays generic.
Save as PNG, then I'll convert to WebP during the build.
Generate 2–4 variations per prompt and pick the best.
Folder layout (put files here):


public/images/
├─ hero/  about/  auth/  departments/  doctors/  services/
├─ marketplace/ (banners/ categories/ products/)
├─ dashboard/  blog/  icons/departments/
1. Style blocks (paste one at the END of each prompt)
🅰 PHOTO style:


Editorial photography of a modern premium hospital, bright natural daylight, soft diffused light, clean white and soft teal (#0EA5A4) color palette with subtle warm wood accents, minimalist architecture, shallow depth of field, 35mm lens, calm and reassuring mood, realistic natural skin tones, diverse people, no text, no logos, no watermark.
🅱 3D ICON style:


3D clay-style render, soft rounded shapes, smooth matte finish, pastel teal and white with a {ACCENT} accent color, soft studio lighting, gentle shadow underneath, centered, three-quarter view, isolated on a transparent background, no text.
🅲 PRODUCT style:


Professional e-commerce studio product photo, centered, front three-quarter angle, soft even lighting, subtle natural shadow, generic unbranded clean white and teal packaging, isolated on a transparent background, no text, no logos.
🅳 ILLUSTRATION style:


Modern flat vector illustration with soft gradients, rounded friendly shapes, palette of teal #0EA5A4, blue #2563EB, coral #F97316 and soft gray, lots of white space, minimal details, isolated on a transparent background, no text.
2. Hero and home page (🅰, 1536x1024)
File	Prompt (add 🅰 at the end)
hero/home-hero.png	A smiling female doctor in a white coat talking warmly with a senior patient in a bright, modern hospital lobby with floor-to-ceiling windows and indoor plants, space on the left side for a headline
hero/home-hero-alt.png	Wide view of a futuristic, airy hospital atrium with glass walls, curved white architecture, green plants and soft daylight, a few blurred people walking, empty sky area at the top for text
hero/emergency.png	Emergency department entrance at dusk, modern ambulance bay with soft red and teal lights, medical staff moving a stretcher calmly and professionally, cinematic but not scary
hero/services.png	Top-down flat-lay of medical tools on a white surface: stethoscope, tablet showing a heart chart, pills organizer, clipboard, arranged neatly with teal accents
hero/doctors.png	A diverse team of six doctors and nurses standing together confidently in a modern hospital corridor, smiling, slightly low angle, natural light
hero/marketplace.png	Modern hospital pharmacy and wellness store interior, clean shelves with generic white and teal products, warm lighting, a pharmacist helping a young customer
hero/contact.png	Exterior of a modern glass hospital building with greenery and a plaza, golden hour light, people walking in
about/team-meeting.png	Doctors in a bright meeting room reviewing medical scans on a large screen, collaborative mood
about/technology.png	Modern operating room with robotic surgical arms and large monitors, cool clean lighting, no blood
about/patient-care.png	A nurse adjusting a pillow for a smiling child patient in a colorful, cheerful pediatric room
about/lab.png	Scientist in a modern laboratory holding a test tube, blurred lab equipment in the background, teal light accents
3. Departments
3a. Department cover photos (🅰, 1536x1024)
Template:


{SCENE}, inside the {DEPARTMENT} department of a modern hospital. + 🅰 style
File (departments/)	{SCENE}
emergency.png	Calm, organized emergency room with medical staff attending a patient on a bed, monitors glowing
icu.png	Modern ICU room with advanced monitors, a nurse checking vitals, soft blue light
anesthesiology.png	Anesthesiologist preparing equipment next to an operating table, focused and calm
cardiology.png	Cardiologist explaining a 3D heart model to a middle-aged patient, ECG on a screen behind
neurology.png	Neurologist reviewing a colorful brain MRI scan on a large display with a patient
gastroenterology.png	Doctor explaining a digestive system diagram on a tablet to a patient in a bright consulting room
pulmonology.png	Patient doing a breathing test with a spirometer while a doctor watches the results
nephrology.png	Comfortable modern dialysis room with reclining chairs, a nurse helping a patient
endocrinology.png	Doctor showing a patient how to use a glucose monitor, friendly consultation
internal-medicine.png	General physician doing a check-up with a stethoscope on an adult patient
general-surgery.png	Surgical team in teal scrubs in a bright modern operating room, viewed from the side, no blood
orthopedics.png	Orthopedic doctor examining a knee X-ray on a lightbox with an athletic patient
neurosurgery.png	Neurosurgeon studying 3D brain imaging on a large curved monitor
urology.png	Urologist in a calm consultation with a male patient, showing a kidney model
plastic-surgery.png	Elegant, minimal aesthetic consultation room, doctor talking with a patient
obstetrics-gynecology.png	Pregnant woman smiling during an ultrasound with a female doctor, soft warm light
pediatrics.png	Friendly pediatrician listening to a smiling child's heartbeat, colorful playful room
neonatology.png	Nurse gently caring for a newborn in a modern neonatal unit, soft warm tones
oncology.png	Supportive oncologist holding a patient's hand in a calm, sunlit room with plants, hopeful mood
dermatology.png	Dermatologist examining a patient's skin with a dermatoscope, clean bright room
ent.png	ENT doctor examining a patient's ear with an otoscope
ophthalmology.png	Patient looking into a modern eye examination machine, ophthalmologist adjusting it
psychiatry.png	Cozy, calm therapy room with soft armchairs, therapist and patient in a relaxed conversation
dentistry.png	Modern dental clinic, smiling patient in a dental chair, dentist with a mirror tool
radiology.png	Modern MRI machine room with a technician preparing a patient, cool clean lighting
pathology-lab.png	Lab technician working with blood samples and an automated analyzer
pharmacy.png	Hospital pharmacist checking medicine on organized shelves, using a tablet
physiotherapy.png	Physiotherapist helping a patient do leg exercises in a bright rehab gym
nutrition.png	Dietitian showing a healthy meal plan with fresh vegetables and fruits on the table
3b. Department icons (🅱, 1024x1024, transparent)
Template:


A 3D icon of {OBJECT}. + 🅱 style with ACCENT = {COLOR}
File (icons/departments/)	{OBJECT}	{COLOR}
emergency.png	an ambulance siren light with a medical cross	red
icu.png	a heart rate monitor screen with a pulse line	blue
anesthesiology.png	an oxygen mask	sky blue
cardiology.png	a stylized anatomical heart with a pulse line	rose pink
neurology.png	a stylized brain	violet
gastroenterology.png	a stylized stomach	amber
pulmonology.png	a pair of lungs	cyan
nephrology.png	a pair of kidneys	crimson
endocrinology.png	a glucose meter with a drop	lime
internal-medicine.png	a stethoscope	teal
general-surgery.png	a scalpel crossed with surgical scissors	slate
orthopedics.png	a bone with a small bandage	orange
neurosurgery.png	a brain with a small precision tool	purple
urology.png	a bladder-shaped water drop	indigo
plastic-surgery.png	a face silhouette with sparkles	peach
obstetrics-gynecology.png	a pregnant belly silhouette with a heart	pink
pediatrics.png	a teddy bear with a band-aid	yellow
neonatology.png	a baby bottle and a pacifier	baby blue
oncology.png	a ribbon with a shield	lavender
dermatology.png	a skin layer cross-section with a drop	sand
ent.png	an ear with sound waves	emerald
ophthalmology.png	an eye	blue
psychiatry.png	a head silhouette with a heart inside	soft purple
dentistry.png	a shiny tooth	mint
radiology.png	an X-ray film of a rib cage	gray-blue
pathology-lab.png	a microscope with a test tube	green
pharmacy.png	a capsule pill and a medicine bottle	teal
physiotherapy.png	a knee joint with a motion arrow	orange
nutrition.png	an apple with a leaf	green
4. Doctor portraits (🅰, 1024x1536)
Template:


Professional headshot portrait of a {PERSON}, {SPECIALTY} doctor, wearing a white coat over {OUTFIT}, stethoscope around the neck, warm confident smile, arms crossed or relaxed, softly blurred modern hospital background, chest-up framing, eye-level. + 🅰 style
File (doctors/)	{PERSON}	{SPECIALTY}	{OUTFIT}
dr-01.png	woman in her 40s, Middle Eastern, wearing a light hijab	cardiology	teal scrubs
dr-02.png	man in his 50s, Black, short gray beard	neurology	light blue shirt and tie
dr-03.png	woman in her 30s, East Asian	pediatrics	pastel pink scrubs
dr-04.png	man in his 30s, South Asian	orthopedics	navy scrubs
dr-05.png	woman in her 50s, European, silver hair	oncology	white blouse
dr-06.png	man in his 40s, Latino	general surgery	teal surgical scrubs and cap
dr-07.png	woman in her 30s, Black, curly hair	dermatology	cream blouse
dr-08.png	man in his 60s, European, glasses	internal medicine	gray shirt
dr-09.png	woman in her 40s, North African	obstetrics & gynecology	lavender scrubs
dr-10.png	man in his 30s, East Asian	radiology	dark blue scrubs
dr-11.png	woman in her 20s, South Asian	psychiatry	soft green blouse
dr-12.png	man in his 40s, Middle Eastern, short beard	dentistry	white dental tunic
Dashboard user avatars (1024x1024): same template, "circular-friendly close-up headshot, plain soft teal gradient background". Make about 8 of them (dashboard/avatar-01…08.png) for patients, nurses and admins in casual clothes or scrubs.

5. ⭐ Marketplace
5a. Hero banners (🅰 or 3D, 1536x1024)
File (marketplace/banners/)	Prompt
banner-checkup.png	Floating 3D composition of a clipboard, stethoscope, heart icon and blood test tube on a soft teal-to-white gradient background, playful premium style, empty space on the left for text, no text
banner-pharmacy.png	Floating 3D pills, capsules and generic medicine bottles bursting outward on a soft mint gradient background, dynamic and clean, empty left side, no text
banner-devices.png	Modern blood pressure monitor, smartwatch with heart rate and pulse oximeter floating on a soft blue gradient with glowing light rings, empty left side, no text
banner-home-lab.png	A friendly lab technician taking a blood sample from a smiling woman on a sofa at home, bright cozy living room. + 🅰
banner-flash-sale.png	Energetic 3D scene of shopping bag with medical cross, gift box and coins on a vibrant coral-to-orange gradient, celebration confetti, empty left side, no text
banner-telemedicine.png	Woman at home on a video call with a doctor on her laptop screen, warm cozy light. + 🅰
banner-wellness.png	Yoga mat, water bottle, fresh fruits, and vitamins arranged in a calm sunlit room, soft green tones. + 🅰
5b. Category tiles (🅱, 1024x1024, transparent)
File (marketplace/categories/)	Object	Accent
lab-tests.png	a rack of blood test tubes with a drop	red
health-packages.png	an open gift box with a medical cross and a heart coming out	teal
pharmacy.png	a medicine bottle with capsules	green
medical-devices.png	a digital blood pressure monitor	blue
mobility.png	a modern wheelchair	slate
consultations.png	a smartphone showing a video call with a doctor icon	indigo
wellness.png	a lotus flower with a water drop	lavender
mother-baby.png	a baby bottle with a small heart	pink
personal-care.png	a skincare pump bottle with a leaf	peach
first-aid.png	a red first-aid kit box	red
5c. Products (🅲, 1024x1024, transparent)
Template:


{PRODUCT}. + 🅲 style
File (marketplace/products/)	{PRODUCT}
bp-monitor.png	Digital upper-arm blood pressure monitor with cuff, white and teal
glucometer.png	Compact glucometer with test strips and a lancet pen
pulse-oximeter.png	Fingertip pulse oximeter with a small digital display
thermometer.png	Infrared forehead thermometer, white with a teal button
nebulizer.png	Portable compressor nebulizer with a mask
stethoscope.png	Professional stethoscope, teal tubing, coiled
weight-scale.png	Smart glass bathroom scale, top view at an angle
heating-pad.png	Soft electric heating pad, folded, gray fabric
knee-brace.png	Adjustable orthopedic knee brace, black and teal
back-support.png	Lumbar back support belt
wheelchair.png	Lightweight foldable wheelchair, modern design
walker.png	Aluminum rollator walker with seat
crutches.png	Pair of adjustable aluminum crutches
hospital-bed.png	Home care electric hospital bed, white
first-aid-kit.png	Compact first aid kit, open, showing bandages and supplies
face-masks.png	Box of surgical face masks with a few masks in front
gloves.png	Box of blue nitrile examination gloves
sanitizer.png	Pump bottle of hand sanitizer gel, generic label
vitamins.png	White supplement jar with capsules spilling out
omega3.png	Amber bottle with golden fish-oil softgels
protein.png	Tub of protein powder with a scoop
pain-relief.png	Generic blister pack of white tablets with a small box
cough-syrup.png	Amber syrup bottle with a measuring cup
pill-organizer.png	Weekly pill organizer with colorful pills
baby-formula.png	Baby formula tin with a scoop
baby-thermometer.png	Baby digital thermometer, pastel colors
sunscreen.png	Dermatology sunscreen tube, white and teal
moisturizer.png	Dermatology moisturizer cream jar
test-kit.png	Rapid home test kit with cassette and swab
smartwatch.png	Health smartwatch showing a heart rate graph on screen
5d. Health packages and lab tests (🅱, 1024x1024)
File (services/)	Object	Accent
pkg-full-body.png	a human body silhouette with a check mark shield	teal
pkg-cardiac.png	a heart inside a shield with a pulse line	rose
pkg-diabetes.png	a sugar cube with a drop and a glucose meter	amber
pkg-women.png	a female symbol with a flower and heart	pink
pkg-senior.png	a walking cane with a heart	blue
pkg-child.png	a teddy bear with a stethoscope	yellow
test-blood.png	a blood drop with a test tube	red
test-thyroid.png	a butterfly-shaped thyroid gland	violet
test-vitamin.png	a sun with a capsule (vitamin D)	orange
6. Auth pages (1024x1536, portrait)
File (auth/)	Prompt
signin.png	Abstract 3D composition of floating soft teal and white glass shapes, a glowing heart pulse line, small medical cross and shield, on a deep teal-to-blue gradient background, premium and calm, no text
signup.png	A happy diverse family (parents, child and grandparent) with a friendly doctor in a bright modern clinic, warm light. + 🅰
forgot-password.png	3D floating padlock with a soft teal glow and small key, on a soft blue gradient background, no text
7. Dashboard and empty states (🅳, 1024x1024, transparent)
File (dashboard/)	Prompt
empty-appointments.png	A calendar with a friendly doctor character pointing at an empty day
empty-orders.png	An empty shopping bag with a medical cross and a small plant
empty-records.png	An empty folder with medical documents floating around
empty-messages.png	Two empty chat bubbles with a stethoscope
empty-search.png	A magnifying glass looking at a small question mark
success-order.png	A delivery box with a check mark and confetti
welcome.png	A friendly doctor character waving next to a laptop showing charts
error-404.png	A confused cute robot nurse holding a broken map
upload-rx.png	A prescription paper with an upload arrow and cloud
8. Blog covers (🅰, 1536x1024)
File (blog/)	Scene
heart-health.png	Person jogging in a park at sunrise, healthy and energetic
nutrition.png	Colorful healthy bowl with vegetables, top view on a wooden table
mental-health.png	Woman meditating peacefully near a big window with plants
sleep.png	Calm bedroom with soft morning light, person sleeping peacefully
child-vaccine.png	Smiling child getting a band-aid from a nurse after a vaccine
diabetes.png	Senior man checking his glucose with a smartwatch in a kitchen
Total: about 150 images. If that's too many, generate these first (enough for a strong first version):

All of section 2 (hero)
All department icons (3b), the 8–10 most important department covers, and 6 doctors
Marketplace banners, category tiles and 15 products
I'll build with placeholders that have the same file names, so your images drop in automatically as you add them.

I can also save this list as a Markdown file in the project (for example docs/image-prompts.md) so you can check images off as you generate them.

9. Chat (added 2026-11-02)
9a. Banners (🅰, 1536x1024)
File	Prompt (add 🅰 at the end)
hero/community.png	A small diverse group of patients of different ages and a friendly nurse chatting warmly around a low table in a bright hospital lounge with plants, some holding phones, relaxed and supportive mood, empty space on the right side for a headline
hero/care-chat.png	A patient at home on a cozy sofa smiling while reading a message on their phone, a cup of tea on the side table, soft daylight through a window, plants in the background, calm and reassured
hero/staff-chat.png	Two nurses in scrubs and a doctor in a white coat at a modern nurses' station looking together at a tablet, calm focused teamwork, soft teal accents, bright corridor behind them
9b. Chat illustrations (🅳, 1024x1024, transparent)
File (dashboard/)	Prompt (add 🅳 at the end)
empty-staff-chat.png	Three overlapping chat bubbles with a small hospital badge and a heart pulse line, suggesting a team conversation waiting to start
empty-community.png	A friendly cluster of speech bubbles of different sizes floating above a small round table with a potted plant, suggesting a group conversation
empty-channel.png	A small wooden signpost with blank arrow boards and one speech bubble on top, inviting someone to start a new topic
community-guidelines.png	A friendly shield holding a speech bubble with a check mark, small lock and heart around it, meaning safe and respectful sharing
moved-to-private.png	A speech bubble floating through an open door into a cozy small room, a padlock on the door frame, meaning a conversation becoming private
9c. Community channel icons (🅱, 1024x1024, transparent)
File (icons/community/)	{OBJECT}	{COLOR}
general.png	two overlapping speech bubbles	teal
custom.png	a speech bubble with a plus sign (default icon for new channels)	blue
medicines.png	a capsule pill and a blister pack	blue
nutrition.png	a green apple next to a leafy salad bowl	green
mental-health.png	a soft head silhouette with a small sprout growing from it	violet
new-parents.png	a baby bottle and a tiny knitted sock	pink
diabetes.png	a glucose meter with a small blood drop	red
heart-health.png	a heart with a pulse line	coral
fitness-recovery.png	a sneaker and a small dumbbell	orange
caregivers.png	two hands gently holding a heart	coral
9d. Chat extras (🅱, 1024x1024, transparent)
File	Prompt (add 🅱 at the end)
icons/chat/emergency.png	A small ambulance next to a phone handset, {ACCENT} = red
dashboard/nick-avatar-01.png … 06.png	Cute round avatar head of a smiling friendly animal, one per file: fox, owl, turtle, cat, bear, rabbit, facing forward, simple and sweet, {ACCENT} = a different pastel for each. These are for patients who post in the Community under a nickname.

10. Insurance (added 2026-11-02)
10a. Banner (🅰, 1536x1024)
File	Prompt (add 🅰 at the end)
hero/insurance.png	A friendly hospital billing staff member at a bright modern reception desk explaining a document to a smiling couple, warm and reassuring, empty space on the left side for a headline
10b. Insurance illustrations (🅳, 1024x1024, transparent)
File (dashboard/)	Prompt (add 🅳 at the end)
upload-insurance-card.png	A blank plastic health card with only simple abstract shapes and no writing, a small camera and an upload arrow with a cloud
empty-insurance.png	An open empty wallet with a soft shield and a plus sign floating above it
empty-claims.png	A clipboard with blank lines and a small shield, a paper airplane flying away from it
claim-approved.png	A shield with a big check mark surrounded by small confetti
claim-pending.png	An hourglass standing next to a document with a small shield seal
claim-denied.png	A document with a soft round cross mark and a small speech bubble with a question mark, calm and not alarming
preapproval.png	A calendar page with a shield and a check mark, a small hospital bed beside it
10c. Insurance icons (🅱, 1024x1024, transparent)
File (icons/insurance/)	{OBJECT}	{COLOR}
in-network.png	a shield with a medical cross and a check mark	green
coverage.png	an umbrella sheltering a heart	blue
card.png	a blank plastic card with a shield emblem and no writing	blue
claim.png	a document with a round shield seal	violet

Note: no images for insurance company logos. The accepted-insurance page uses made-up company names with colored initials, built in HTML.
Total new: about 37 images (chat 25, insurance 12).
