"""Import the supplied self-contained script; generated JSON is committed content."""
import re, json, sys
from pathlib import Path
source=Path(sys.argv[1]).read_text(encoding='utf-8-sig')
script=source.split('6. THE COMPLETE SCRIPT')[1].split('7. TOOLS (EXACT BEHAVIORS)')[0]
cast={
 'mags':dict(name='Mags Dufour',role='Head of Security',accent='#7FE7FF',voice='bf_emma',speed=.94,want='A documented door, not a secret route.',fear='An unlogged entry.'),
 'soren':dict(name='Soren Vidal',role='Lead Architect',accent='#FFB03B',voice='bm_george',speed=.94,want='Keep the machine running.',fear='A preventable outage.'),
 'tavi':dict(name='Tavi Osei',role='Infrastructure Engineer',accent='#9BE3C5',voice='am_michael',speed=1.01,want='Have the evidence taken seriously.',fear='Being wrong in public.'),
 'jonas':dict(name='Jonas Reiter',role='CEO',accent='#8CB9FF',voice='am_fenrir',speed=.98,want='Gate Five by Friday.',fear='A down round.'),
 'imani':dict(name='Imani Okoro',role='Co-founder / Chief Scientist',accent='#D5C2F2',voice='af_heart',speed=.93,want='Honor the capability review agreement.',fear='Being proved right too late.'),
 'pa':dict(name='Terminal PA',role='Halcyon night shift',accent='#EAF6FF',voice='bf_isabella',speed=.94,want='',fear=''),
 'narration':dict(name='The terminal',role='Narration',accent='#EAF6FF',voice='bm_daniel',speed=.97,want='',fear=''),
}
meta=[
 ('S00','ENTR','terminal','Badge in','Choose captions or recorded voices, then enter.','entry','S01'),
 ('S01','CINEMA','terminal','Arrive at Halcyon','Watch the arrival or skip ahead.','continue','S02'),
 ('S02','FACE','terminal','Scan your badge','Drag your badge to the scanner, or tap Scan.','badge','S03'),
 ('S03','FACE','floor','Meet the architect','Answer Soren. Your exact words are saved.','reply','S04'),
 ('S04','TOOL','floor','Notice the mismatch','Move the playhead to 2:14 and inspect the dip.','mini-log','S05'),
 ('S05','PHONE','terminal','Set expectations with Jonas','Choose what you can promise.','reply','S06'),
 ('S06','NARR','floor','Take your role','Read your assignment and available resources.','continue','S07'),
 ('S07','MAP','floor','Choose where to investigate','Visit the Ops wall and Rack row, then Security.','map','S08'),
 ('S08','TOOL','floor','Match three throttle dips','Mark dips within six seconds of a benchmark gain.','logs','S07'),
 ('S09','TOOL','server','Trace the unexpected process','Follow the job crossing index 70 through its lineage.','trace','S07'),
 ('S10','FACE','floor','Earn server-hall access','Present two clues or build an unlogged route.','access','S11'),
 ('S11','TOOL','server','Reveal the invisible wall','Hold the lens over the central etched seam for one second.','uvlens','S12'),
 ('S12','TOOL','server','Build a falsifiable theory','Link three clues to hypotheses. Inspect conflicting evidence.','board','S13'),
 ('S13','FACE','server','Choose how to act','Work around, escalate, or investigate the author first.','action','S13b'),
 ('S13a','TOOL','server','Build the shadow cluster','Connect the server hall to Cage C within your compute budget.','route','S14'),
 ('S13b','FACE','floor','Present three pieces of evidence','Select three different clues for Soren.','brief','S14'),
 ('S14','FACE','server','Own the first consequences','Read why the team responded this way.','continue','S15'),
 ('S15','CINEMA','annex','Enter the Founders’ Annex','Use your escort or author trail to reach Imani.','continue','S16'),
 ('S16','FACE','annex','Explain your current theory','Answer Imani without claiming evidence you do not have.','theory','S17'),
 ('S17','TOOL','annex','Compare the milestone and the limit','Inspect index 74 against Gate Five at 78.','threshold','S18'),
 ('S18','TOOL','server','Test the conditions that matter','Run Low, Medium or High load. Pause and 2× speed are available.','staging','S19'),
 ('S19','PHONE','annex','Brief the CEO','Choose direct, evasive or governance-first wording.','briefing','S20'),
 ('S20','TOOL','annex','Make the interlock decision','Preview each policy, lift the guard, then confirm.','interlock','S21'),
 ('S21','FACE','annex','Face the policy consequences','Read the response to the choice you made.','continue','S22'),
 ('S22','CINEMA','server','Prepare for the investor test','Resolve safety evaluations before the final stability run.','evals','S23'),
 ('S23','TOOL','server','Hold the waveform in the band','Damper, queue and cooldown control a seeded 30-second simulation.','stability','S24'),
 ('S24','CINEMA','server','See what your policy proved','Compare the result with the safety question you were answering.','continue','S25'),
 ('S25','FACE','annex','Make one final commitment','Choose the charter, runbook, headline, a split or none.','final','S26'),
 ('S26','TOOL','annex','The Glass Wall','Review your night, inspect the truth, reflect and fork a different decision.','debrief',None),
]
groups={x[0]:[] for x in meta}; current=None
pattern=re.compile(r'(PA VOICE|NARRATION|MAGS(?: \(PA\))?|SOREN(?: or TAVI[^\[]*)?|TAVI|JONAS|IMANI)\s*(?:\[([^\]]+)\])?:\s*"([^"]+)"',re.I)
for raw in script.splitlines():
 m=re.match(r'^(S\d{2}[ab]?)\b',raw)
 if m: current=m.group(1); continue
 if not current: continue
 for match in pattern.finditer(raw):
  speaker=match[1].lower().replace(' voice','').split(' (')[0].split(' or ')[0]
  text=match[3]; expr=match[2] or 'neutral'
  groups[current].append(dict(id=f'{current.lower()}-{len(groups[current])+1}',speaker=speaker,expression=expr,text=text,voiceId=speaker,phase='before'))
def add(s,sp,text,phase='before',when=None):
 groups[s].append(dict(id=f'{s.lower()}-{len(groups[s])+1}',speaker=sp,expression='thinking',text=text,voiceId=sp,phase=phase,**({'when':when} if when else {})))
add('S00','narration','Something is stopping the model. Nobody will say what.')
add('S06','narration','You are PM, Model Platform. Find what throttles Vesper. Decide what to do.')
add('S07','narration','Pick where to look. Each stop costs time.')
if not any(l['speaker']=='narration' for l in groups['S11']): add('S11','narration','The hall is fog and white light. Something hums.')
add('S26','narration','The wall was deliberate. It steadied the system. What did your night prove?')
# Conditions attach to each original spoken line, never to paraphrases.
def after(s,start,conditions=None):
 for i,line in enumerate(groups[s]):
  if i>=start: line['phase']='after'
  if conditions and i in conditions: line['when']=conditions[i]
after('S02',1);after('S03',3,{3:'choice:A',4:'choice:B',5:'choice:C'});after('S04',1)
after('S05',1,{1:'choice:A',2:'choice:B',3:'choice:C'});after('S08',1);after('S09',1)
after('S10',1,{1:'access:ask',2:'access:ask',3:'access:refused',4:'access:sneak'})
for line in groups['S11']:line['phase']='after' if line['speaker']=='tavi' else 'before'
after('S13',1,{1:'choice:workaround',2:'choice:flag',3:'choice:investigate'})
after('S13a',1);after('S13b',1)
for i,line in enumerate(groups['S14']):line['when']=['shadow','flagged','traced'][i]
for i,line in enumerate(groups['S15']):
 if i:line['when']='flagged' if i==1 else 'authorAccess'
after('S16',2,{2:'choice:A',3:'choice:B',4:'choice:C'})
after('S18',1,{1:'tested:highOrMedium',2:'tested:lowOnly'})
after('S19',1,{1:'choice:direct',2:'choice:evasive',3:'choice:governance'})
after('S20',1,{1:'interlock:dismantle',2:'interlock:integrate',3:'interlock:defer'})
for i,line in enumerate(groups['S21']):line['when']='interlock:dismantle' if i<2 else 'interlock:integrate'
for i,line in enumerate(groups['S24']):line['when']=['ending:fast','ending:fast','ending:meltdown','ending:governed','ending:governed','ending:safe','ending:shadow'][min(i,6)]
add('S10','mags','Camera four reports motion. Probably a cat.','after','spotted')
# S25 uses speaker labels without expression brackets in the original script.
if not groups['S25']:
 for sp,text in [('imani','Put the line in the charter.'),('soren','Give my team the runbook.'),('jonas','Give me one headline for investors.')]:add('S25',sp,text)
choices={
 'S03':[('A','Understood.'),('B',"What's blocking Gate Five?"),('C',"I'll move carefully.")],
 'S05':[('A','On it.'),('B',"I'll find the blocker first."),('C',"What's the real deadline?")],
 'S10':[('ask','Ask for access with evidence'),('refuse','Ask without evidence'),('sneak','Find another way')],
 'S13':[('workaround','Build a quiet workaround.'),('flag','Flag it to Soren and Mags.'),('investigate','Investigate who built it first.')],
 'S16':[('A','A safety limit.'),('B','A cost control.'),('C',"I don't know yet.")],
 'S19':[('direct','Yes. A founder installed a safety limit.'),('evasive',"A scheduler quirk. We're fixing it."),('governance','A safeguard. I need the founders in the room.')],
 'S20':[('dismantle','Dismantle the wall'),('integrate','Integrate as a Governor'),('defer','Defer · spend 45 minutes')],
 'S25':[('charter','Put the line in the charter'),('runbook','Give the team the runbook'),('headline','Give investors a headline'),('split','Split the commitment'),('none','Make no additional promise')],
}
root=Path('content/invisible-wall');(root/'scenes').mkdir(parents=True,exist_ok=True)
scenes=[]
for id,kind,bg,goal,can,tool,nxt in meta:
 if not groups[id]:add(id,'narration',can)
 if tool not in ['entry','continue','map','debrief'] and not any(l['phase']=='after' for l in groups[id]):add(id,'narration','Your choice is recorded. Inspect the result before moving on.','after')
 scene=dict(id=id,type=kind,background=bg,speakers=sorted(set(l['speaker'] for l in groups[id])),lines=groups[id],choices=[dict(id=i,text=t,effects={},receipt={'S03':'R01','S05':'R02','S13':'R03','S16':'R04','S19':'R05','S20':'R06'}.get(id),next={'S13':{'workaround':'S13a','flag':'S13b','investigate':'S13'}}.get(id,{}).get(i,nxt)) for i,t in choices.get(id,[])],tool=tool,goal=goal,canStill=can,next=nxt)
 scenes.append(scene);(root/'scenes'/(id+'.json')).write_text(json.dumps(scene,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(root/'scenes.json').write_text(json.dumps(scenes,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(root/'cast.json').write_text(json.dumps(cast,indent=2)+'\n',encoding='utf-8')
(root/'audio-manifest.json').write_text('{"version":1,"lines":{}}\n',encoding='utf-8') if not (root/'audio-manifest.json').exists() else None
print('Generated',len(scenes),'scenes,',sum(len(s['lines']) for s in scenes),'lines.')
