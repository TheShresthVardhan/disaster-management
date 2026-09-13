import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, CardHeader, CardBody, Badge, PlaceholderCard } from '../components/ui';
import './SafetyInfo.css';

function topicSlug(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}

const safetyCategories = [
  {
    id: 'preparedness',
    title: 'Preparedness',
    icon: '🎒',
    description: 'Plan ahead and build resilience before disaster strikes.',
    topics: [
      {
        title: 'Family Emergency Plan',
        description: 'Create a comprehensive plan for your household',
        guide: [
          'Pick two meeting points: one near home, one outside your neighbourhood (school ground, community hall).',
          'Save 112 plus your district DDMA number in every family member\u2019s phone.',
          'Assign roles: who grabs documents, who helps elders and children, who shuts off gas and power.',
          'Practise the plan twice a year, including once at night.',
          'Share the plan with a relative outside Sikkim as an out-of-area contact.',
        ],
      },
      {
        title: 'Emergency Supply Kit',
        description: 'Build a 72-hour kit with essential supplies',
        guide: [
          'Store 72 hours of water (4 litres per person per day) plus dry food such as rice, dal, and energy bars.',
          'Pack a torch with extra batteries, a battery radio, a first-aid kit, and a 7-day course of essential medicines.',
          'Keep photocopies of Aadhaar, land papers, and insurance in a waterproof pouch.',
          'Add warm layers, raincoats, and sturdy shoes — Sikkim nights turn cold fast.',
          'Check and rotate food, water, and medicines every six months.',
        ],
      },
      {
        title: 'Communication Plan',
        description: 'Establish how to contact family during emergencies',
        guide: [
          'Agree on one out-of-area contact everyone checks in with by SMS — texts go through when calls fail.',
          'Keep one basic feature phone charged; its battery outlasts smartphones.',
          'Learn your exact address plus two nearby landmarks to give responders.',
          'Charge power banks before monsoon alerts and keep a car charger as backup.',
          'Follow only IMD, NDMA, and Sikkim SDRF bulletins — do not forward unverified messages.',
        ],
      },
      {
        title: 'Financial Preparedness',
        description: 'Protect finances and documents before disaster',
        guide: [
          'Keep small cash at home — ATMs and UPI fail during power and network outages.',
          'Photograph valuables and every room for insurance claims; store copies offline and in the cloud.',
          'Check your policy: standard home insurance often excludes floods and landslides without add-on riders.',
          'Keep account numbers and insurer helplines written on paper, not just in your phone.',
        ],
      },
      {
        title: 'Pet Preparedness',
        description: 'Include pets in your emergency planning',
        guide: [
          'Pack 3 days of pet food, water, bowls, a leash, and any medicines in your go-bag.',
          'Keep vaccination records and a recent photo of each pet for identification.',
          'Plan who carries the pet during evacuation — never leave animals tied up.',
          'Identify pet-friendly shelters or relatives in advance; most relief shelters restrict animals.',
        ],
      },
    ],
  },
  {
    id: 'evacuation',
    title: 'Evacuation',
    icon: '🚗',
    description: 'Know when and how to evacuate safely.',
    topics: [
      {
        title: 'Evacuation Routes',
        description: 'Identify and practice multiple exit routes',
        guide: [
          'Learn at least two routes out of your area — monsoon landslides routinely block NH-10 and NH-310.',
          'Walk each route once so you know it in the dark or in heavy rain.',
          'Note high-ground points along each route for flash-flood scenarios.',
          'Follow BRO and police diversions; never move roadblocks or risk unstable slopes.',
          'Leave early — roads jam within an hour of an official alert.',
        ],
      },
      {
        title: 'Shelter Locations',
        description: 'Find designated emergency shelters near you',
        guide: [
          'Ask your panchayat or DDMA for the designated relief shelter for your ward.',
          'Visit it once before an emergency so every family member recognises the way.',
          'Note backup options: schools, community halls, and monasteries on high ground.',
          'Keep the shelter\u2019s contact number and the route written on paper.',
        ],
      },
      {
        title: 'Go-Bag Essentials',
        description: 'Pack a ready-to-grab evacuation bag',
        guide: [
          'Pack the documents pouch, 3-day medicines, torch, power bank, and cash first.',
          'Add 2 litres of water, dry snacks, and a change of warm clothes per person.',
          'Include baby supplies, sanitary pads, and spare spectacles where needed.',
          'Keep the bag by the door through monsoon (June–September) and test grabbing it in under 2 minutes.',
        ],
      },
      {
        title: 'Transportation Options',
        description: 'Plan for vehicles, public transit, or assistance',
        guide: [
          'Keep fuel above half a tank during monsoon and high-alert periods.',
          'Agree with neighbours on shared vehicles for households without one.',
          'Know the nearest taxi stand and keep the driver\u2019s number saved.',
          'If no vehicle is available, move on foot to high ground early — do not wait for transport in a flash flood.',
        ],
      },
      {
        title: 'Special Needs Planning',
        description: 'Accommodate mobility, medical, and access needs',
        guide: [
          'List every household member\u2019s medical, mobility, and sensory needs on one sheet.',
          'Arrange a buddy who checks on elderly or disabled members when alerts sound.',
          'Pack extra medicines, hearing-aid batteries, and mobility chargers in the go-bag.',
          'Inform your ASHA worker or panchayat about bedridden members before monsoon.',
        ],
      },
    ],
  },
  {
    id: 'shelter',
    title: 'Sheltering',
    icon: '🏠',
    description: 'Stay safe whether at home or in a community shelter.',
    topics: [
      {
        title: 'Home Sheltering',
        description: 'Shelter-in-place procedures and safe rooms',
        guide: [
          'Pick an interior room without windows on the highest safe floor for storms and floods.',
          'Stock it in advance with water, snacks, a torch, a radio, and blankets.',
          'Seal gaps under doors with wet towels only for smoke or dust events — never for gas leaks.',
          'Stay put until the official all-clear; most injuries happen from going out too early.',
        ],
      },
      {
        title: 'Community Shelters',
        description: 'What to expect at public emergency shelters',
        guide: [
          'Register on arrival and note the medical desk and drinking-water point.',
          'Keep valuables on your person; use shelter storage only if items are labelled.',
          'Volunteer for cleaning or kitchen duty — shelters run on community help.',
          'Report fever, diarrhoea, or skin infections early to stop outbreaks.',
        ],
      },
      {
        title: 'Shelter-in-Place',
        description: 'Sealing rooms for chemical/hazmat events',
        guide: [
          'Lock doors and windows and switch off fans, coolers, and AC units that pull in outside air.',
          'Move to the room with the fewest openings and seal vents with tape and plastic.',
          'Listen to the battery radio for the all-clear; do not step out to \u201ccheck\u201d.',
          'For a gas leak inside the house do the opposite: leave immediately and call 112 from outside.',
        ],
      },
      {
        title: 'Shelter Safety Rules',
        description: 'Guidelines for behavior in shared shelters',
        guide: [
          'No smoking, candles, or open flames inside shared halls.',
          'Keep gangways clear for stretchers and wheelchairs.',
          'Observe quiet hours to protect children and the elderly — keep phones on vibrate.',
          'Follow the warden\u2019s instructions during headcounts and supply distribution.',
        ],
      },
      {
        title: 'Post-Disaster Housing',
        description: 'Temporary and long-term housing options',
        guide: [
          'Do not re-enter until authorities declare the building safe.',
          'Photograph all damage before cleaning anything, for compensation claims.',
          'Ask the DDMA about interim shelters and rental assistance schemes.',
          'Beware of fraudsters demanding advance payment for repairs or aid.',
        ],
      },
    ],
  },
  {
    id: 'hazards',
    title: 'Hazard-Specific',
    icon: '⚠️',
    description: 'Guidance tailored to specific disaster types.',
    topics: [
      { title: 'Earthquake Safety', description: 'Drop, Cover, Hold On and structural safety' },
      { title: 'Flood Safety', description: 'Avoid floodwater, evacuation, cleanup safety' },
      { title: 'Wildfire Safety', description: 'Defensible space, evacuation, smoke protection' },
      { title: 'Hurricane Safety', description: 'Storm preparation, surge zones, wind safety' },
      { title: 'Tornado Safety', description: 'Warning signs, safe rooms, post-storm hazards' },
      { title: 'Extreme Heat/Cold', description: 'Temperature illness prevention and treatment' },
      { title: 'Landslide Safety', description: 'Warning signs, evacuation, slope stability' },
      { title: 'Tsunami Safety', description: 'Natural warnings, evacuation, coastal safety' },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery',
    icon: '🔧',
    description: 'Navigate the aftermath safely and effectively.',
    topics: [
      {
        title: 'Returning Home Safely',
        description: 'Structural checks, utilities, contamination',
        guide: [
          'Wait for the official all-clear; inspect leaning walls, cracked beams, and sagging roofs from outside first.',
          'Sniff for gas — if suspected, leave, warn neighbours, and call 112 from a distance.',
          'Switch power on only after an electrician checks waterlogged wiring.',
          'Wear boots, gloves, and a mask while clearing debris and mud.',
        ],
      },
      {
        title: 'Documenting Damage',
        description: 'Photos, inventory, insurance documentation',
        guide: [
          'Photograph every damaged room and item with timestamps before moving anything.',
          'Make a room-by-room list with approximate purchase price and age.',
          'Keep all repair bills and receipts in one folder.',
          'File the insurance intimation within 24–48 hours and note the claim number.',
        ],
      },
      {
        title: 'Insurance Claims',
        description: 'Filing process, adjusters, dispute resolution',
        guide: [
          'Read exclusions first — floods and landslides often need add-on covers.',
          'Do not sign blank claim forms or accept on-the-spot low settlements.',
          'Escalate in writing to the insurer\u2019s grievance cell, then to the Insurance Ombudsman if unresolved in 30 days.',
          'Track SDRF compensation announcements through the DDMA, not middlemen.',
        ],
      },
      {
        title: 'Mental Health Support',
        description: 'Crisis counseling, stress management, PTSD',
        guide: [
          'Shock, sleeplessness, and anxiety after a disaster are normal — talk about them.',
          'Keep routines for children; let them play and ask questions honestly.',
          'Call Tele-MANAS 14416 for free mental-health support.',
          'Seek professional help if distress lasts beyond a month or affects daily life.',
        ],
      },
      {
        title: 'Community Resources',
        description: 'Local aid, volunteer orgs, government programs',
        guide: [
          'Register at the relief camp or panchayat office to get on aid lists.',
          'Contact the DDMA control room for verified NGO and volunteer support.',
          'Offer your skills — driving, nursing, cooking, translating — at the local volunteer desk.',
          'Share only verified helpline numbers and report rumours to authorities.',
        ],
      },
    ],
  },
];

const hazardGuides = {
  earthquake: {
    title: 'Earthquake Safety',
    before: [
      'Secure heavy furniture, appliances, and water heaters to wall studs',
      'Create a family emergency plan with meeting points and out-of-area contact',
      'Build an emergency kit (water, food, flashlight, first aid, radio, medications)',
      'Identify safe spots in each room (under sturdy tables, against interior walls)',
      'Practice "Drop, Cover, and Hold On" drills with all household members',
      'Know how to shut off gas, water, and electricity',
      'Store critical documents in a fireproof, waterproof container',
    ],
    during: [
      'DROP to hands and knees immediately',
      'COVER head and neck under sturdy furniture or with arms',
      'HOLD ON to your shelter until shaking stops',
      'Stay indoors - do not run outside during shaking',
      'If in bed, stay there and protect head with pillow',
      'If driving, pull over, stop, and set parking brake',
      'If outdoors, move away from buildings, trees, and power lines',
    ],
    after: [
      'Check for injuries and provide first aid',
      'Expect aftershocks - be ready to Drop, Cover, Hold On',
      'Inspect home for damage (gas leaks, water, electrical, structural)',
      'Use phone only for life-threatening emergencies',
      'Listen to emergency broadcasts for updates',
      'Stay out of damaged buildings',
      'Help neighbors who may need assistance',
    ],
  },
  flood: {
    title: 'Flood Safety',
    before: [
      'Know your flood risk zone and evacuation routes',
      'Elevate utilities (electrical panel, furnace, water heater) above flood level',
      'Waterproof basement and install sump pump with battery backup',
      'Store important documents in waterproof container on upper level',
      'Have sandbags, plastic sheeting, and flood barriers ready',
      'Purchase flood insurance (standard homeowners policies exclude floods)',
      'Sign up for local flood warning systems',
    ],
    during: [
      'Move to higher ground immediately - do not wait for instructions',
      'Do not walk, swim, or drive through flood waters',
      '6 inches of moving water can knock an adult down',
      '1 foot of water can float a vehicle; 2 feet can carry away SUVs',
      'Stay off bridges over fast-moving water',
      'If trapped in building, go to highest level (avoid attics)',
      'If vehicle stalls in water, abandon it and move to higher ground',
    ],
    after: [
      'Wait for authorities to declare area safe before returning',
      'Avoid floodwater - may contain sewage, chemicals, debris',
      'Check for structural damage before entering building',
      'Turn off electricity at main breaker if safe to do so',
      'Discard food and medicine that contacted floodwater',
      'Document damage with photos/video for insurance claims',
      'Clean and disinfect everything that got wet',
    ],
  },
  wildfire: {
    title: 'Wildfire Safety',
    before: [
      'Create defensible space: 30-100 ft clearance around structures',
      'Use fire-resistant landscaping and building materials',
      'Prepare go-bag with N95 masks, documents, medications, valuables',
      'Know multiple evacuation routes from your neighborhood',
      'Sign up for local emergency alerts and keep a battery radio ready',
      'Install fine mesh screens on vents to block embers',
      'Keep gutters and roof clear of leaves and debris',
    ],
    during: [
      'Evacuate immediately if ordered - do not wait to see fire',
      'Close all windows, doors, vents, and pet doors',
      'Shut off gas at meter and LPG at cylinder regulator',
      'Leave lights on for firefighter visibility in smoke',
      'Drive slowly with headlights on; watch for emergency vehicles',
      'If trapped, stay inside, away from outside walls',
      'Call 112 and give your exact location if you cannot evacuate',
    ],
    after: [
      'Return only when authorities say area is safe',
      'Check for hot spots, smoldering debris, and ash pits',
      'Wear N95 mask, gloves, and protective clothing',
      'Document damage with photos for insurance',
      'Beware of weakened trees, power lines, and structures',
      'Check water quality before using',
      'Contact the local health department for guidance',
    ],
  },
  landslide: {
    title: 'Landslide Safety',
    before: [
      'Learn the warning signs: new cracks in walls or ground, tilting poles or trees, sudden spring water, rumbling sounds',
      'Avoid building or sleeping below steep cut slopes, especially during monsoon (June–September)',
      'Keep drainage channels around your house clear — blocked drains trigger slides',
      'Know your evacuation route to high, flat ground and practise it with family',
      'Report cracks or subsidence to the panchayat, PWD, or BRO immediately',
      'Keep your go-bag ready through monsoon; slides often strike at night',
    ],
    during: [
      'Evacuate the slide path immediately — move sideways first, then to high ground',
      'Listen for rumbling, cracking trees, or grinding boulders and move fast if you hear them',
      'Stay away from the slide area; secondary slides often follow within hours',
      'Warn neighbours as you leave and call 112 with your exact location',
      'If escape is impossible, curl into a tight ball and protect your head',
    ],
    after: [
      'Stay away — the slope may slide again for days after the first event',
      'Check injured people without moving the seriously hurt unless they are in danger',
      'Avoid damaged areas, broken power lines, and blocked streams that can burst suddenly',
      'Report the slide to the DDMA with photos and location so clearance teams can respond',
      'Do not rebuild on the scar without a geological assessment',
      'Watch for further cracking or tilting in nearby houses and report it',
    ],
  },
  cyclone: {
    title: 'Cyclone Safety',
    before: [
      'Track IMD bulletins; know your nearest cyclone and flood shelter in advance',
      'Trim weak branches, secure tin roofs, and anchor loose sheets and hoardings',
      'Charge phones and power banks; stock 3 days of water and dry food',
      'Move livestock and vehicles to high, sheltered ground',
      'Keep documents in a waterproof pouch inside your go-bag',
    ],
    during: [
      'Stay indoors in the strongest part of the house, away from windows and doors',
      'Do not go out in the lull — the second half of the storm follows',
      'Switch off power at the mains if water enters the house',
      'Listen to the battery radio and ignore rumours on social media',
      'If the roof lifts, shelter under a sturdy table or bed and protect your head',
    ],
    after: [
      'Wait for the all-clear; beware of fallen power lines and weakened trees',
      'Boil or chlorinate drinking water until authorities confirm the supply is safe',
      'Photograph damage for insurance claims before clearing debris',
      'Help clear drains to prevent waterlogging, mosquito breeding, and disease',
      'Do not touch dangling wires — report them to the electricity department',
    ],
  },
};

function SafetyInfo() {
  const [activeCategory, setActiveCategory] = useState('preparedness');
  const [activeHazard, setActiveHazard] = useState('earthquake');
  const [activePhase, setActivePhase] = useState('before');
  const [checkedItems, setCheckedItems] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  // Deep-link support: /safety?topic=go-bag-essentials expands that guide
  const [expandedTopic, setExpandedTopic] = useState(() => searchParams.get('topic'));

  const toggleTopic = (slug) => {
    setExpandedTopic((prev) => {
      const next = prev === slug ? null : slug;
      setSearchParams(next ? { topic: next } : {});
      return next;
    });
  };

  const category = safetyCategories.find((c) => c.id === activeCategory);
  const hazard = hazardGuides[activeHazard];

  const toggleCheck = (phase, index) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${phase}-${index}`]: !prev[`${phase}-${index}`]
    }));
  };

  return (
    <div className="page safety-page">
      <div className="container-fluid px-3 px-md-4">
        <header className="page-header mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="page-header-icon" aria-hidden="true">📚</div>
            <div>
              <h1 className="h2 fw-bold mb-1">Safety Guidelines</h1>
              <p className="text-muted mb-0">
                Comprehensive guides for disaster preparedness, response, and recovery
              </p>
            </div>
          </div>
        </header>

        <div className="row g-4">
          <nav className="col-lg-3" aria-label="Safety categories">
            <Card variant="elevated" className="h-100 sticky-top safety-sidebar" style={{ top: '100px' }}>
              <CardHeader title="Categories" />
              <CardBody className="p-0">
                <div className="safety-category-list">
                  {safetyCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`safety-category-item ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => { setActiveCategory(cat.id); setActivePhase('before'); }}
                      aria-current={activeCategory === cat.id ? 'true' : 'false'}
                    >
                      <span className="safety-category-icon" aria-hidden="true">{cat.icon}</span>
                      <span className="safety-category-label">{cat.title}</span>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </nav>

          <main className="col-lg-9" role="main">
            {activeCategory === 'hazards' ? (
              <Card variant="elevated" className="hazard-guide">
                <CardHeader
                  title={hazard.title}
                  subtitle="Phase-specific safety guidance"
                  action={
                    <div className="hazard-tabs" role="tablist">
                      {Object.keys(hazardGuides).map((key) => (
                        <Button
                          key={key}
                          variant={activeHazard === key ? 'primary' : 'outline'}
                          size="sm"
                          role="tab"
                          aria-selected={activeHazard === key}
                          onClick={() => { setActiveHazard(key); setActivePhase('before'); }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  }
                />
                <CardBody>
                  <div className="phase-tabs mb-4" role="tablist">
                    {['before', 'during', 'after'].map((phase) => (
                      <Button
                        key={phase}
                        variant={activePhase === phase ? 'primary' : 'outline'}
                        size="sm"
                        role="tab"
                        aria-selected={activePhase === phase}
                        onClick={() => setActivePhase(phase)}
                      >
                        {phase.charAt(0).toUpperCase() + phase.slice(1)} Disaster
                      </Button>
                    ))}
                  </div>

                  <div className="safety-checklist">
                    <h4 className="checklist-title">
                      {activePhase.charAt(0).toUpperCase() + activePhase.slice(1)} the Disaster
                    </h4>
                    {hazard[activePhase].map((item, idx) => (
                      <label key={idx} className="checklist-item">
                        <input
                          type="checkbox"
                          checked={checkedItems[`${activePhase}-${idx}`] || false}
                          onChange={() => toggleCheck(activePhase, idx)}
                          className="checklist-checkbox"
                        />
                        <span className="checklist-text">{item}</span>
                      </label>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card variant="elevated" className="category-content">
                <CardHeader
                  title={category.title}
                  subtitle={category.description}
                  action={<span className="category-icon-large" aria-hidden="true">{category.icon}</span>}
                />
                <CardBody>
                  <div className="row g-3">
                    {category.topics.map((topic) => {
                      const slug = topicSlug(topic.title);
                      const expanded = expandedTopic === slug;
                      return (
                      <div key={topic.title} className="col-md-6 col-lg-4">
                        <div className="topic-card h-100">
                          <div className="topic-card-header">
                            <h4 className="topic-title">{topic.title}</h4>
                          </div>
                          <div className="topic-card-body">
                            <p className="topic-description">{topic.description}</p>
                            {expanded && topic.guide && (
                              <ol className="topic-guide">
                                {topic.guide.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            )}
                          </div>
                          <div className="topic-card-footer">
                            <Button
                              variant={expanded ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => toggleTopic(slug)}
                              aria-expanded={expanded}
                            >
                              {expanded ? 'Hide Guide' : 'Read Guide'}
                            </Button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}
          </main>
        </div>

        <section className="emergency-contacts mt-4" aria-labelledby="contacts-title">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="contacts-title" className="h4 fw-bold mb-0">Emergency Contacts</h2>
            <Badge variant="info" size="sm">Quick Reference</Badge>
          </div>
          <div className="row g-3">
            {[
              { name: 'Emergency Services (India)', number: '112', type: 'Police, Fire, Medical & Disaster — single number', icon: '🚨' },
              { name: 'Sikkim SDRF / Disaster Management', number: '112 / 03592-202-201', type: 'Sikkim State Emergency Operation Centre', icon: '🏔️' },
              { name: 'NDMA / NDRF Helpline', number: '1078 / 011-26701700', type: 'National disaster helpline & control room', icon: '🏛️' },
              { name: 'Ambulance / Medical', number: '102 / 108', type: 'Medical emergency & ambulance', icon: '🚑' },
              { name: 'IMD Weather Alerts', number: 'mausam.imd.gov.in', type: 'Weather alerts & forecasts (India)', icon: '🌤️' },
              { name: 'Local DDMA', number: 'Check district directory', type: 'District emergency management (Sikkim)', icon: '📍' },
            ].map((contact) => (
              <div key={contact.name} className="col-12 col-md-6 col-lg-4">
                <Card variant="outlined" hoverable className="h-100 contact-card">
                  <CardBody className="text-center p-4">
                    <span className="contact-icon" aria-hidden="true">{contact.icon}</span>
                    <h4 className="contact-name">{contact.name}</h4>
                    <p className="contact-number fw-bold text-primary mb-1">{contact.number}</p>
                    <p className="contact-type text-muted small mb-0">{contact.type}</p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section className="coming-soon mt-4" aria-labelledby="coming-title">
          <h2 id="coming-title" className="h4 fw-bold mb-3">Additional Resources (Coming Soon)</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <PlaceholderCard
                title="Interactive Checklists"
                description="Track your preparedness progress with saveable checklists"
                icon="✅"
                features={['Progress tracking', 'Custom reminders', 'Family sharing']}
              />
            </div>
            <div className="col-md-4">
              <PlaceholderCard
                title="Video Guides"
                description="Step-by-step video tutorials for key safety procedures"
                icon="🎥"
                features={['Drop Cover Hold On', 'Go-bag packing', 'Home hardening']}
              />
            </div>
            <div className="col-md-4">
              <PlaceholderCard
                title="Community Training"
                description="Certified emergency response training programs"
                icon="🎓"
                features={['CERT programs', 'First aid/CPR', 'Ham radio licensing']}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SafetyInfo;