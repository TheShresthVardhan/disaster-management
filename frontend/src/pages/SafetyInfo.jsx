import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardBody, Badge, PlaceholderCard } from '../components/ui';
import './SafetyInfo.css';

const safetyCategories = [
  {
    id: 'preparedness',
    title: 'Preparedness',
    icon: '🎒',
    description: 'Plan ahead and build resilience before disaster strikes.',
    topics: [
      { title: 'Family Emergency Plan', description: 'Create a comprehensive plan for your household' },
      { title: 'Emergency Supply Kit', description: 'Build a 72-hour kit with essential supplies' },
      { title: 'Communication Plan', description: 'Establish how to contact family during emergencies' },
      { title: 'Financial Preparedness', description: 'Protect finances and documents before disaster' },
      { title: 'Pet Preparedness', description: 'Include pets in your emergency planning' },
    ],
  },
  {
    id: 'evacuation',
    title: 'Evacuation',
    icon: '🚗',
    description: 'Know when and how to evacuate safely.',
    topics: [
      { title: 'Evacuation Routes', description: 'Identify and practice multiple exit routes' },
      { title: 'Shelter Locations', description: 'Find designated emergency shelters near you' },
      { title: 'Go-Bag Essentials', description: 'Pack a ready-to-grab evacuation bag' },
      { title: 'Transportation Options', description: 'Plan for vehicles, public transit, or assistance' },
      { title: 'Special Needs Planning', description: 'Accommodate mobility, medical, and access needs' },
    ],
  },
  {
    id: 'shelter',
    title: 'Sheltering',
    icon: '🏠',
    description: 'Stay safe whether at home or in a community shelter.',
    topics: [
      { title: 'Home Sheltering', description: 'Shelter-in-place procedures and safe rooms' },
      { title: 'Community Shelters', description: 'What to expect at public emergency shelters' },
      { title: 'Shelter-in-Place', description: 'Sealing rooms for chemical/hazmat events' },
      { title: 'Shelter Safety Rules', description: 'Guidelines for behavior in shared shelters' },
      { title: 'Post-Disaster Housing', description: 'Temporary and long-term housing options' },
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
      { title: 'Returning Home Safely', description: 'Structural checks, utilities, contamination' },
      { title: 'Documenting Damage', description: 'Photos, inventory, insurance documentation' },
      { title: 'Insurance Claims', description: 'Filing process, adjusters, dispute resolution' },
      { title: 'Mental Health Support', description: 'Crisis counseling, stress management, PTSD' },
      { title: 'Community Resources', description: 'Local aid, volunteer orgs, government programs' },
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
      'Sign up for local emergency alerts (reverse 911, apps)',
      'Install 1/8-inch mesh screens on vents to block embers',
      'Keep gutters and roof clear of leaves and debris',
    ],
    during: [
      'Evacuate immediately if ordered - do not wait to see fire',
      'Close all windows, doors, vents, and pet doors',
      'Shut off gas at meter and propane at tank',
      'Leave lights on for firefighter visibility in smoke',
      'Drive slowly with headlights on; watch for emergency vehicles',
      'If trapped, stay inside, away from outside walls',
      'Call 911 and give your location if you cannot evacuate',
    ],
    after: [
      'Return only when authorities say area is safe',
      'Check for hot spots, smoldering debris, and ash pits',
      'Wear N95 mask, gloves, and protective clothing',
      'Document damage with photos for insurance',
      'Beware of weakened trees, power lines, and structures',
      'Check water quality before using',
      'Contact local health department for guidance',
    ],
  },
};

function SafetyInfo() {
  const [activeCategory, setActiveCategory] = useState('preparedness');
  const [activeHazard, setActiveHazard] = useState('earthquake');
  const [activePhase, setActivePhase] = useState('before');
  const [checkedItems, setCheckedItems] = useState({});

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
                    {category.topics.map((topic) => (
                      <div key={topic.title} className="col-md-6 col-lg-4">
                        <div className="topic-card h-100">
                          <div className="topic-card-header">
                            <h4 className="topic-title">{topic.title}</h4>
                          </div>
                          <div className="topic-card-body">
                            <p className="topic-description">{topic.description}</p>
                          </div>
                          <div className="topic-card-footer">
                            <Button variant="outline" size="sm" as={Link} to={`/safety?topic=${topic.title.toLowerCase().replace(/\s+/g, '-')}`}>
                              Read Guide
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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