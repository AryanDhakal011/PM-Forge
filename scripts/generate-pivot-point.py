"""Deterministic, fictional authoring assets. No real patient data."""
import json, random
from pathlib import Path

root=Path(__file__).resolve().parents[1]
out=root/'content/pivot-point'; out.mkdir(parents=True,exist_ok=True)
def write(name,data):
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
people=[
 ('kapoor','Dr. Saanvi Kapoor','Chief Medical Officer','The standard must travel with the care.','#137e85','#bf8a68','#353b3f'),
 ('hamid','Hamid Rahimi','Chief Financial Officer',"I’m not the villain. I’m the arithmetic.",'#51677a','#ba896b','#29333b'),
 ('tamsin','Tamsin Reilly','Chief Executive Officer','How will this read in a year?','#a87334','#e6b293','#784e3c'),
 ('esi','Esi Boateng','Community Health Lead','Names first. Numbers second.','#b05c43','#82513e','#292d32'),
 ('jun','Jun Matsuda','Outcomes Analyst','The confidence interval is wide.','#3d8780','#d1a285','#303c42'),
 ('bernard','Bernard Okoye','Board Chair','Show me the downside you accepted.','#294c63','#8c5b42','#c5c5bb'),
 ('raman','Raman Thapa','Shopkeeper, 54','My shop does not run itself.','#5d8571','#b58261','#434142'),
 ('sita','Sita Gurung','Nurse’s aide, 31','I need a slot around my shifts.','#9b6d74','#c29170','#35343b'),
 ('alvarez','Mr. Alvarez','Retired bus driver, 72','I know the route. It is still long.','#63788c','#c29b81','#d1ccc2')]
write('people.json',[dict(id=i,name=n,role=r,tell=t,color=c) for i,n,r,t,c,sk,h in people])
art=root/'public/projects/pivot-point';(art/'portraits').mkdir(parents=True,exist_ok=True);(art/'backgrounds').mkdir(exist_ok=True)
for idx,(i,n,r,t,c,skin,hair) in enumerate(people):
 for mood in ['neutral','thinking','annoyed','approving','pressured']:
  mouth={'approving':'M79 139 Q100 158 121 139','annoyed':'M83 149 Q100 140 117 149','pressured':'M86 146 L114 146','thinking':'M86 145 Q100 149 114 144','neutral':'M83 144 Q100 151 117 144'}[mood]
  coat='#f5f7f0' if i=='kapoor' else c
  props='<path d="M60 214l25-30 16 29 19-30 23 32" fill="none" stroke="#0c7982" stroke-width="14"/><path d="M58 111h32m20 0h32m-52 0h20" stroke="#314b53" stroke-width="3"/><rect x="59" y="102" width="30" height="19" rx="6" fill="none" stroke="#314b53" stroke-width="3"/><rect x="111" y="102" width="30" height="19" rx="6" fill="none" stroke="#314b53" stroke-width="3"/>' if i=='kapoor' else '<rect x="115" y="206" width="57" height="74" rx="5" fill="#244551" transform="rotate(12 140 240)"/>' if i=='hamid' else '<path d="M45 218q55-41 110 0" stroke="#e1b264" stroke-width="19" fill="none"/>' if i=='esi' else '<path d="M48 93q0-53 52-53t52 53m-104 0v26m104-26v26" stroke="#b4c9c5" stroke-width="10" fill="none"/>' if i=='jun' else ''
  svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#e9f4f0"/><stop offset="1" stop-color="#bed6cf"/></linearGradient></defs><rect width="200" height="300" rx="8" fill="url(#bg)"/><circle cx="103" cy="105" r="80" fill="#fff" opacity=".35"/><path d="M8 300v-48q4-60 72-68h40q68 8 72 68v48" fill="{coat}"/><path d="M83 159v35l17 24 17-24v-35" fill="{skin}"/><path d="M53 92q-5-60 49-60t47 60v40H53" fill="{hair}"/><ellipse cx="100" cy="113" rx="47" ry="65" fill="{skin}"/><path d="M53 86q4-65 56-52 38 6 42 56-24-12-33-32-26 26-65 28" fill="{hair}"/><path d="M68 99l16-3m32 0 16 3" stroke="{hair}" stroke-width="4" stroke-linecap="round"/><ellipse cx="79" cy="110" rx="3" ry="4" fill="#243942"/><ellipse cx="121" cy="110" rx="3" ry="4" fill="#243942"/><path d="M99 113l-5 15h10" stroke="#805e4d" fill="none" stroke-width="2"/><path d="{mouth}" fill="none" stroke="#734c41" stroke-width="3" stroke-linecap="round"/>{props}<path d="M25 285h151" stroke="#fff" opacity=".2"/></svg>'''
  (art/'portraits'/f'{i}_{mood}.svg').write_text(svg,encoding='utf-8')
for place in ['atrium','corridor','community','boardroom','launch']:
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><linearGradient id="light" x2="1" y2="1"><stop stop-color="#f7faf7"/><stop offset="1" stop-color="#b8d7d2"/></linearGradient><pattern id="windows" width="170" height="260" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="152" height="240" fill="#d6e9e3"/><path d="M85 8v240M8 150h152" stroke="#f7faf7" stroke-width="8"/></pattern></defs><rect width="1600" height="1000" fill="url(#light)"/><path d="M560 0h1040v690H560z" fill="url(#windows)"/><path d="M0 700l1600-80v380H0" fill="#e3e6db"/><path d="M0 1000l800-340 800 340M400 1000l400-340 400 340M0 820h1600M0 930h1600" stroke="#b6c8c0" fill="none"/><path d="M470 0h45v760h-45M1140 0h45v700h-45" fill="#f9faf2"/><rect x="800" y="390" width="400" height="190" rx="6" fill="#173b42"/><text x="830" y="435" font-family="sans-serif" font-size="20" fill="#a6d9d2">LUMEN HEALTH / {place.upper()}</text><text x="830" y="501" font-family="serif" font-size="55" fill="#f7faf7">A place for care.</text><path d="M1270 680h110l-20 150h-70z" fill="#ae7e5d"/><path d="M1325 700V390m0 200q-90-100-90-160 90 10 90 120m0 65q90-100 90-160-90 10-90 120" fill="#729980" stroke="#4c7965" stroke-width="9"/><ellipse cx="720" cy="825" rx="180" ry="40" fill="#b0cbc6"/><ellipse cx="720" cy="812" rx="180" ry="40" fill="#d1e6df"/><ellipse cx="720" cy="811" rx="120" ry="22" fill="none" stroke="#8fbab3" stroke-width="3"/><rect x="1390" y="750" width="100" height="5" fill="#8c674d"/></svg>'''
 (art/'backgrounds'/f'{place}.svg').write_text(svg,encoding='utf-8')
rng=random.Random(5105)
patients=[]
for j in range(1000):
 far=j<410
 patients.append(dict(id=f'L{j:04}',x=round(rng.uniform(.08,.94),3),y=round(rng.uniform(.12,.91),3),severity=rng.randint(1,5),distance=rng.randint(26,80) if far else rng.randint(1,25),income='limited' if j%3==0 else 'steady',condition=['mobility','daily activity','endurance'][j%3],rank=round(rng.random(),5)))
write('patients.json',patients)
names=[('raman','Raman Thapa',54,52,'Shopkeeper. A day away closes the shop.',4),('sita','Sita Gurung',31,38,'Nurse’s aide. Changing shifts make appointments difficult.',3),('alvarez','Mr. Alvarez',72,21,'Retired driver. Two buses to every appointment.',5),('maya','Maya Rai',43,67,'Teacher. Her sister can help on Tuesdays.',3),('dev','Dev Shah',29,8,'Apprentice. Needs specialist support and a return-to-work plan.',5),('ama','Ama Mensah',61,46,'Gardener. Travel costs take most of her spare income.',4),('leo','Leo Pereira',36,12,'Parent. Can attend before school pickup.',2),('nima','Nima Sherpa',58,73,'Farmer. The harvest cannot wait.',4),('rosa','Rosa Silva',47,18,'Tailor. Works from home and wants independence.',3),('arun','Arun Basnet',66,6,'Retired clerk. A neighbor can accompany him.',5),('zuri','Zuri Kamau',33,42,'Baker. Morning sessions mean lost wages.',2),('min','Min Park',51,16,'Librarian. Needs a consistent weekly appointment.',4)]
write('cases.json',[dict(id=i,name=n,age=a,distance=d,story=s,severity=v,rank=round((j+1)/15,3)) for j,(i,n,a,d,s,v) in enumerate(names)])
write('programs.json',dict(waitlist=3214,budget=3600000,flagship=dict(cost=9000,recovery=.82,underserved=.08),community=dict(cost=900,recovery=.54,safeRecovery=.63,safeguardCost=.12,underserved=.62)))
reports=[('outcomes','Outcome registry','Shows how well each program works.','Flagship: 82 of 100 recover. Community: 54 of 100.','kapoor','Intensive works. That is not the question.'),('cost','Cost ledger','Shows what each recovery costs.','Flagship: 9,000 per patient. Community: 900.','hamid','The denominator changes the conversation.'),('waitlist','Waitlist data','Shows who is waiting and where.','41 percent live beyond 25 kilometres.','jun','Distance is part of the product.'),('staff','Staff survey','Shows how clinicians feel about each model.','Specialists fear quality drops. Community staff feel unseen.','kapoor','A model also needs people willing to deliver it.'),('field','Field notes · Esi','Shows why people do not arrive.','Travel costs and missed shifts. Not reluctance.','esi','Now you see them.'),('equity','Equity gap','Shows who the flagship cannot reach.','The flagship reaches 8 percent of the underserved.','esi','Look beyond the hospital gates.'),('funding','Funding runway','Shows how long the budget lasts.','The budget holds for three years at today’s volume.','hamid','A promise needs a second year.')]
write('reports.json',[dict(id=i,title=t,soWhat=w,reading=r,speaker=p,reaction=a) for i,t,w,r,p,a in reports])
def lines(speaker,*texts):return [dict(speaker=speaker,text=t,expression='thinking') for t in texts]
spec=[
 ('ENTR','atrium','Choose how to enter the year.',[],lines('narrator','Everyone on this list is a person.')),
 ('CINEMA','atrium','Meet the waiting list.',[],lines('narrator','Lumen Health. Six sites. One waiting board.','Three thousand two hundred fourteen names.','Most will not get a place this year.')),
 ('TOOL','corridor','Place Raman. Both choices cost something.',['first'],lines('raman','My shop does not run itself.','Every place given is a place withheld.')),
 ('FACE','atrium','Understand the CEO’s concern.',['reply'],lines('tamsin','Tamsin. CEO. Welcome to Lumen.','The region is proud of our recovery program.','Our budget cannot grow. Our waitlist can.')),
 ('FACE','corridor','Ask what protecting quality means.',['question'],lines('kapoor','Saanvi Kapoor. Medical officer. I protect the standard.','I will not sign a model I would not choose for my mother.')),
 ('FACE','boardroom','Explore the funding route.',['reply'],lines('hamid',"Hamid. Finance. I’m not the villain. I’m the arithmetic.",'A premium hub would pay for a lot of good.')),
 ('FACE','community','Choose whose world to see first.',['walk'],lines('esi','People wait because we are far. Come and see.')+lines('jun',"I can show you what the data says. It’s messy.")),
 ('DAYZERO','community','Try the loop. Practice costs nothing.',['sandbox'],lines('coach','Practice first. Nothing here counts.')),
 ('DESK','atrium','Understand who is reached today. Choose your first reports.',['planner'],lines('jun','Six attention points. What deserves them?')),
 ('TOOL','boardroom','Open three reports. Leave with evidence, and blind spots.',['drawers'],lines('jun','Three reports. Seven drawers. You cannot read everything.')),
 ('MAP','community','Apply lenses. See who is missing.',['map','designer'],lines('esi','Apply a lens. See who is missing.','A model is also a list of who it cannot reach.')),
 ('TOOL','boardroom','Compare costs using both denominators.',['ledger'],lines('hamid','Excellence is expensive. Access is cheaper per person.')),
 ('TOOL','corridor','Place twelve cases. Explain your allocations.',['case'],lines('kapoor','Twelve cases. Seven intensive places. Choose.')),
 ('FACE','boardroom','Commit to a direction and record why.',['direction'],lines('tamsin','I need your direction before the budget meeting.')),
 ('NARR','atrium','Examine what your first commitment changed.',['consequence'],lines('jun','The choice has reached the rest of the building.')),
 ('CINEMA','corridor','Month 5 · The CMO Standoff.',[],lines('narrator','Month five. The CMO standoff.')),
 ('FACE','corridor','Respond to the clinical concern.',['reply'],lines('kapoor','Show me what happens when the model falls short.')),
 ('TOOL','boardroom','Test three years of uncertainty.',['scalability','designer','frontier'],lines('jun','Three years. Move the sliders. Watch the cone.')),
 ('TOOL','community','Fund the safeguards you intend to promise.',['guardrails'],lines('esi','Supervision costs money. Without it, people fall through.')),
 ('FACE','boardroom','Present your design with three evidence cards.',['presentation','designer','frontier'],lines('hamid','Show me payback and the downside.')+lines('tamsin','How will this read in a year?')),
 ('NARR','corridor','Read the clinical decision and its conditions.',['consequence','letters'],lines('kapoor','A signature is a promise to the people delivering care.')),
 ('CINEMA','launch','Month 9 · The Patient Pivot.',[],lines('narrator','Month nine. The patient pivot.')),
 ('LAUNCH','launch','Watch five moments. You have three interventions.',['launch'],lines('esi','First site. Forty patients today.','I brought coffee. The printer brought opinions.')),
 ('FACE','boardroom','Link two pieces of evidence and name the downside.',['board'],lines('bernard','Show me the downside you accepted.')),
 ('CINEMA','community','Read the year your choices made possible.',['letters'],lines('narrator','One year. One model. Different journeys.')),
 ('FACE','boardroom','Choose what next year protects.',['final'],lines('esi','Fund the community workers properly.')+lines('kapoor','Protect specialist time.')+lines('hamid','Publish the numbers.')),
 ('REVIEW','atrium','Explore your decisions, the alternatives, and the people.',['frontier','letters','review'],lines('narrator','The year ends. The tradeoffs remain.'))]
scenes=[]
for j,(typ,bg,g,tools,ls) in enumerate(spec):
 scene=dict(id=f'S{j:02}',type=typ,background=bg,goal=g,tools=tools,lines=ls)
 scenes.append(scene);write(f'scenes/S{j:02}.json',scene)
write('scenes/index.json',scenes)
events=[]
for chapter in range(1,4):
 for route,speaker,text in [('flagship','kapoor','Specialist sessions remain protected.'),('flagship','esi','Travel remains a barrier for distant families.'),('community','esi','Community appointments fit around working lives.'),('community','kapoor','Local teams need a dependable escalation route.'),('hybrid','jun','Referral capacity connects both parts of the model.'),('hybrid','hamid','Coordination has a cost. Keep it visible.'),('premium','hamid','Premium revenue gives the budget breathing room.'),('premium','kapoor','Specialists question what the new model asks of them.')]:
  events.append(dict(id=f'E{chapter}-{len(events):02}',chapter=chapter,route=route,speaker=speaker,text=text))
write('events/deck.json',events)
write('letters.json',[
 dict(patient='raman',reached='I can see my shop from the clinic door now. I walked to the market again.',missed='I am still waiting. My sister helps with the shop on appointment days.'),
 dict(patient='sita',reached='My appointment fits between shifts. I start Monday. I have written it twice.',missed='I could not make the journey fit my shifts. Please keep my name on the list.'),
 dict(patient='alvarez',reached='The doctor listened. The bus was long. Thank you.',missed='I still take my morning walk. I would like to hear about the next place.')])
write('templates.json',dict(receipts=['P01','P02','P03','P04','P05'],label='Simulated health network, authored scenarios, expert review pending',reasonChips=['Severity','Distance','Risk','Fairness']))
print(f'Authored {len(scenes)} scenes, {len(patients)} sample patients, {len(events)} events and 45 portraits.')
