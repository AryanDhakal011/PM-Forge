"""Authoring source for the fictional Ignis simulation. No runtime generation."""
import json
from pathlib import Path
root=Path('content/feature-factory')
def put(name,data):
 p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
names=[('reva','Reva Sandoval','Head of Product','#B69CFF','af_heart','A launch every Friday.','Being left behind.','violet scarf'),('cass','Cass Whitlock','CEO','#FFB84D','am_michael','Speed the board can see.','Losing the investor window.','rocket pin'),('nils','Nils Bergstrom','Engineering Lead','#85B9C7','bm_george','A plan the team can survive.','Another lost weekend.','travel mug'),('amara','Amara Eze','QA Lead','#5CE0A0','af_nicole','A release gate with evidence.','Being overruled again.','bug notebook'),('kofi','Kofi Mensah','Data Analyst','#E7B8F0','am_fenrir','Someone to ask about retention.','Being blamed for bad news.','headphones'),('lila','Lila Park','Customer Success','#F3BA92','af_bella','Customers who can rely on us.','Renewals lost to broken promises.','headset')]
topics=[['Roadmap pressure','What Cass wants','The demo','Zenith headline','Retention','Risks','How you are measured','What you will back'],['Investor timeline','Why speed','A bad Friday','Reliability','Who is pushing','The Pulse','Quarterly review','What changes your mind'],['Debt list','Estimates','Burnout','What breaks first','What you need','A safer plan','Who you trust','Weekend coverage'],['Release criteria','Open bugs','Test coverage','Last incident','Evidence you need','Staging risks','Past overrules','Feature flags'],['Retention trend','Cohorts','Pulse inflation','The funnel','Metric definition','Data trust','What went unsaid','Disagreeing dashboards'],['Complaints','Churn','What customers love','Requests','Customer quotes','SLA fears','Renewal calendar','Customer call']]
leadins=[['Every Friday needs a story.','Cass needs visible progress.','A demo is a promise.','Give me an honest headline.','Retention moves slowly. That matters.','Let us name the risk.','I am measured on launches.','Bring evidence. I can back that.'],['The board is watching this quarter.','Speed buys us another chance.','Silence on Friday scares me.','Reliability needs to be visible too.','Investors want a reason to stay.','The Pulse is easy to explain.','Tell me what changed.','A credible alternative changes my mind.'],['The foundations are charging interest.','An estimate is not a promise.','People are tired of being surprised.','Autosave breaks before the demo does.','Give us room to finish.','Less work in flight. More hardening.','I trust people who close loops.','I would like my weekend back.'],['A gate needs teeth.','Every bug has a person behind it.','Coverage is a tool, not permission.','Let us read the incident record.','Evidence needs an owner and a date.','Staging is trying to tell us something.','I have heard looks fine before.','A flag gives us an exit.'],['Thirty days. The same people returning.','Cohorts expose what totals hide.','More sessions can mean more interruptions.','The funnel needs a clean definition.','Pick an outcome before a chart.','Disagreement is a reason to investigate.','I thought nobody wanted this answer.','Both dashboards can be technically correct.'],['Lost work is a broken promise.','Churn has a story behind it.','Customers love work that stays saved.','Requests are clues, not commitments.','Here is what a customer said.','An SLA becomes personal during outages.','Renewals arrive whether we are ready.','I can bring a customer into this.']]
people=[];clips=[]
for i,(pid,name,role,color,voice,want,fear,prop) in enumerate(names):
 person=dict(id=pid,name=name,role=role,color=color,voice=voice,speed=.94 if pid=='nils' else .99,want=want,fear=fear,prop=prop,topics=topics[i],leadins=leadins[i]);people.append(person);put(Path('ask')/(pid+'.json'),[dict(id=f'{pid}-{j}',topic=t,line=leadins[i][j]) for j,t in enumerate(topics[i])])
 for j,line in enumerate(leadins[i]):clips.append(dict(id=f'ask-{pid}-{j}',speaker=pid,text=line,expression='thinking'))
put(Path('people.json'),people)
backlog=[('01','Streak Confetti',3,9,.1,2),('02','Live Dashboard Tiles',5,12,0,4),('03','Notification Digest',5,3,1.4,2),('04','Search Speed Fix',8,1,2.2,-5),('05','Autosave Reliability',5,0,1.8,-4),('06','Mobile Offline Mode',13,2,2.6,6),('07','AI Summaries',8,8,.4,5),('08','SSO for Enterprise',8,0,.2,3),('09','Export to CSV',3,0,.3,1),('10','Permission Refactor',8,0,0,-9),('11','Webhook Retries',5,0,.2,-4),('12','Dark Mode',3,2,.1,1)]
put(Path('backlog.json'),[dict(id=id,title=t,estimate=e,pulse=p,retention=r,debt=d) for id,t,e,p,r,d in backlog])
# Each condition is a declared engine predicate. Choices are explicit, validated action sets.
events=[
 ('E01','lila','Lost work, three customers','Three customers cited autosave losses. Quote attached.','always','05','customer'),
 ('E02','kofi','The number nobody opens','Retention is flat. Look at the Truth tab.','fog','','truth'),
 ('E03','reva','A little more sparkle','Can the demo tiles blink? Just a little.','tiles','02','polish'),
 ('E04','cass','A promise from Sales','Sales promised SSO to a prospect. Friday.','scope','08','scope'),
 ('E05','amara','Ticket 4471 · P1','Autosave is losing edits in staging. Ticket forty-four seventy-one.','autosaveRisk','05','bug'),
 ('E06','nils','The weekend boundary','I am not doing another weekend. We need a different plan.','debtHigh','10','boundary'),
 ('E07','amara','A gate without evidence','There is no stress evidence for this release.','untested','','tests'),
 ('E08','nils','Tuesday, the bill arrives','The rushed release is straining the write queue.','rushed','11','outage'),
 ('E09','kofi','A chart leaves the building','Cass shared the Pulse. That is not retention.','vanity','','truth'),
 ('E10','nils','Work to rule','Only planned tickets now. No more invisible overtime.','nilsLow','','trust'),
 ('E11','nils','A resignation draft','Someone asked me for a reference. We should talk.','moraleLow','','boundary'),
 ('E12','lila','A renewal goes quiet','A customer is asking how to export everything.','lilaLow','09','customer'),
 ('E13','kofi','An actual return visit','The returning cohort is moving. Let us check why.','retentionUp','','win'),
 ('E14','amara','The tiles are expensive','Live tiles are delaying the rest of the app.','tilesShipped','02','bug'),
 ('E15','reva','The Zenith headline','What is the headline for Zenith?','week2','','headline'),
 ('E16','amara','An exit that worked','The flag gave us a clean rollback.','flagged','','win'),
 ('E17','cass','Room for one more?','Could we stretch? The foundations look healthier.','debtLow','06','scope'),
 ('E18','reva','Your own words','You wrote that down. Does the decision still hold?','receipt','','receipt'),
 ('E19','kofi','Two dashboards, two stories','These dashboards disagree because they measure different things.','fogLate','','truth'),
 ('E20','nils','A very public summary','The tweet says AI. The implementation says temporary workaround.','ai','07','scope'),
 ('E21','cass','The reliability question','Are we a reliable company? I need an honest answer.','manyIncidents','','headline'),
 ('E22','nils','A quiet thank you','I made it to my daughter’s recital. Thank you.','healthy','','win'),
 ('E23','cass','A ticket over your head','I assigned this directly. We need momentum.','cassLow','02','scope'),
 ('E24','reva','Before the board arrives','What changed, what proves it, and what do you need?','week3','','headline'),
 ('E25','amara','The test suite is manual','We can automate the regression checks. It will take focus.','manual','','automate'),
 ('E26','kofi','Instrument the return path','Define a returning user before the next launch.','fog','','truth'),
 ('E27','lila','Finally','A customer wrote one word. Finally.','reliable','','win'),
 ('E28','nils','A blocked pull request','A dependency is waiting for a decision. Not more code.','inflight','','unblock'),
 ('E29','amara','A rehearsal, not a release','Could we test the rollback before Friday?','noRollback','','rollback'),
 ('E30','reva','The room is watching','We need a demo, even if we narrow it.','pulsePlan','01','polish'),
 ('E31','lila','Search feels different','A customer found their old notes without asking us.','searchDone','','win'),
 ('E32','nils','Interest, paid down','The queue is quieter. Maintenance bought us capacity.','debtLow','','win'),
 ('E33','cass','An investor clip','Could we show the new tiles in the investor clip?','pulsePlan','02','polish'),
 ('E34','kofi','A cohort worth following','Digest users are returning without extra nudges.','retentionUp','','win'),
 ('E35','lila','The enterprise request','The renewal needs single sign-on. Can we give a date?','always','08','scope'),
 ('E36','amara','A second pair of eyes','I can review the riskiest change with you.','bugsHigh','','tests'),
 ('E37','nils','Finish before starting','We have too much open work. Pick what stops.','overloaded','','boundary'),
 ('E38','kofi','A small honest chart','The cohort is modest. It is still real progress.','truth','','win'),
 ('E39','reva','Tell me the trade-off','I can defend a smaller release if you explain it.','healthy','','receipt'),
 ('E40','lila','A promise has a date','Customers remember the date, not our sprint points.','debtHigh','05','customer'),
 ('E41','amara','Quiet is evidence too','No new high-priority reports today. Keep the checks.','reliable','','win'),
 ('E42','cass','Friday is getting louder','What can we safely show without making another promise?','vanity','01','headline'),
]
all_events=[dict(id=id,speaker=p,title=t,text=line,condition=c,feature=f,kind=k,cooldown=2,choices=['do','schedule','delegate','decline','ask']) for id,p,t,line,c,f,k in events]
for w in range(1,4):put(Path('events')/(f'week-{w}.json'),[dict(e,window=w) for e in all_events])
for e in all_events:clips.append(dict(id=e['id'],speaker=e['speaker'],text=e['text'],expression='pressured' if e['kind'] in ['bug','outage','boundary'] else 'neutral'))
intro=[('pa','Release forty-one is live.'),('cass','Faster! Faster!'),('pa','Every Friday, the gong. Every Monday, a longer list.'),('reva',"I'm Reva. Head of Product. We ship every Friday."),('reva',"Cass wants a bigger Friday. Let's not boil the ocean."),('reva','Show me a plan Monday that makes the Pulse sing.'),('cass','Ten, nine, eight. What ships Friday?'),('nils','Nils. Engineering. Our debt list is longer than your roadmap.'),('nils',"I'll do what you plan. I'd like a plan I can survive."),('kofi','Retention has been flat for a year. Does anyone read it?'),('amara',"Release gate criteria are still looks fine. Can we write real ones?"),('lila','Three customers cited autosave losses. Quote attached.')]
for i,(p,line) in enumerate(intro):clips.append(dict(id=f'intro-{i}',speaker=p,text=line,expression='thinking' if p=='nils' else 'neutral'))
extras=[('metric-pulse','reva','Good. The Pulse is our story.'),('metric-retention','reva',"Retention? It is slow to move."),('metric-features','amara','Counting output is not counting results.'),('promise-tiles','cass',"That's the spirit."),('promise-search','cass','Search? Boring. Why?'),('promise-plan','cass','Monday. Make it big.'),('plan','reva','Fill the sprint. Thirty points.'),('gate','amara',"Pick the criteria. I'll check them."),('gate-reva','reva','Cass wants the gong at five. Go?'),('hold','nils','Thank you. Quietly.'),('hold-cass','cass','Next Friday, then.'),('week2','pa','Week two. The Debt Collector.'),('week3','pa','Week three. The Zenith Review.'),('review','reva','Show us what changed. Then ask for what comes next.'),('incident','nils','The write queue is stalled. We need a decision.'),('retention','kofi','Finally someone asked.'),('flag','amara','A limited rollout gives us an exit.'),('spin','cass','It sounds good. Can we substantiate it?')]
for id,p,t in extras:clips.append(dict(id=id,speaker=p,text=t,expression='thinking'))
put(Path('dialogue.json'),clips);put(Path('audio-manifest.json'),dict(version=1,lines={}))
manifest=[('ENTR','Clock in'),('CINEMA','Meet the Friday ritual'),('TOOL','Pick your steering metric'),('FACE','Meet Reva'),('FACE','Answer Cass'),('FACE','Meet Nils'),('CHAT','Meet the people behind your inbox'),('TOOL','Plan Monday'),('DESK','Tuesday'),('DESK','Wednesday'),('DESK','Thursday'),('DESK','Friday morning'),('TOOL','Make the release call'),('CINEMA','Gong or silence'),('FACE','Read the consequences'),('CINEMA','The Debt Collector'),('DESK','Run sprint two'),('INCIDENT','Diagnose the incident'),('TOOL','Make the second release call'),('CINEMA','The Zenith Review'),('DESK','Run sprint three'),('TOOL','Present three slides'),('REVIEW','Review your quarter')]
for i,(type,goal) in enumerate(manifest):put(Path('scenes')/f'S{i:02}.json',dict(id=f'S{i:02}',type=type,background='factory' if type in ['ENTR','CINEMA'] else 'desktop',goal=goal,tools={'TOOL':['board','allocation','stress','gate','slides'],'DESK':['inbox','board','dashboard','calendar'],'INCIDENT':['logs']}.get(type,[])))
put(Path('templates.json'),dict(slots=['day','feature','pulse','retention','debt','bugs','playerLine','trust','topic'],variants=dict(warm=['Good call on {feature}.','You wrote: “{playerLine}”','Day {day}: debt is {debt}.'],neutral=['The current feature is {feature}.','Your record says: “{playerLine}”','Day {day}: bugs total {bugs}.'],cold=['{feature} is still the commitment.','You promised: “{playerLine}”','Day {day}: trust is {trust}.'])))
print('Authored',len(all_events),'events,',len(clips),'recordings, 48 ask topics, 23 screen definitions.')
