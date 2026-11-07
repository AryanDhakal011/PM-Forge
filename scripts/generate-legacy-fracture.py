"""Authored, fictional Granger content. Deterministic generation for review."""
import json
from pathlib import Path

root = Path("content/legacy-fracture")
for part in ["scenes", "events"]:
    (root / part).mkdir(parents=True, exist_ok=True)

def put(name, value):
    (root / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

people = [
    dict(id="oswald", name="Oswald Price", role="Chief Dispatch Engineer", want="The rules he built to be understood.", fear="A replacement that erases them.", prop="pencil", accent="#bc8d3e", voice="bm_george", speed=.91),
    dict(id="cora", name="Cora Granger", role="Chief Operating Officer", want="A moving fleet through peak.", fear="An outage on her watch.", prop="keys", accent="#873f36", voice="af_nicole", speed=.95),
    dict(id="isaac", name="Isaac Nakamura", role="Chief Financial Officer", want="The cost of failure in writing.", fear="An open-ended migration bill.", prop="ledger", accent="#b29768", voice="am_michael", speed=.89),
    dict(id="renata", name="Renata Okafor", role="Regional Operations Manager", want="Drivers home on time.", fear="Explaining delays she did not cause.", prop="vest", accent="#d2884d", voice="af_bella", speed=.98),
    dict(id="leif", name="Leif Aaberg", role="Platform Engineer", want="A real replacement to build.", fear="The part no diagram admits.", prop="laptop", accent="#71a293", voice="bm_lewis", speed=1.04),
    dict(id="alistair", name="Alistair Granger", role="Chairman", want="A firm that lasts another century.", fear="A rushed change that loses its memory.", prop="cane", accent="#ddbd71", voice="bm_daniel", speed=.86),
]
put("people.json", people)

node_rows = [
    ("ROUTE_CORE","GRID-3 routing core","legacy","known"),
    ("ROAD_TABLE","Road restrictions table","legacy","known"),
    ("OVERRIDE_UI","Dispatcher override screen","legacy","known"),
    ("NIGHT_BATCH","Nightly route batch","legacy","known"),
    ("TIME_WINDOWS","Customer time windows","legacy","known"),
    ("DEPOT_QUEUE","Depot queue","legacy","known"),
    ("DRIVER_APP","Driver handset feed","legacy","known"),
    ("ETA_EXPORT","ETA export","legacy","known"),
    ("MANIFEST","Freight manifest","legacy","known"),
    ("BILLING","Billing","legacy","known"),
    ("CUSTOMS_X","Border code table","legacy","known"),
    ("TELEMETRY","Truck telemetry","legacy","known"),
    ("DISPATCH_LOG","Dispatch audit log","legacy","known"),
    ("CAPACITY","Capacity allocator","legacy","audit"),
    ("LOAD_BALANCE","Load balancing","legacy","audit"),
    ("SLA_FLAGS","Service level flags","legacy","audit"),
    ("INVOICE_RUN","Invoice run","legacy","audit"),
    ("NORTHERN_GATE","Northern crossing clearance","legacy","audit"),
    ("CUSTOMER_FEED","Customer status feed","legacy","audit"),
    ("FUEL_ROUTE","Fuel route planner","legacy","audit"),
    ("DELAY_CODES","Delay reason codes","legacy","audit"),
    ("LEDGER_SYNC","2 AM ledger sync","legacy","oral"),
    ("PATCH_2003","2003 customs patch","legacy","oral"),
    ("BORDER_FALLBACK","Manual border fallback","legacy","oral"),
]
nodes=[dict(id=k,label=l,zone=z,discovery=d) for k,l,z,d in node_rows]
edges=[
    ("ROAD_TABLE","ROUTE_CORE","known"),("TIME_WINDOWS","ROUTE_CORE","known"),("ROUTE_CORE","DEPOT_QUEUE","known"),("DEPOT_QUEUE","DRIVER_APP","known"),
    ("ROUTE_CORE","ETA_EXPORT","known"),("ETA_EXPORT","CUSTOMER_FEED","audit"),("OVERRIDE_UI","NIGHT_BATCH","known"),("NIGHT_BATCH","ROUTE_CORE","known"),
    ("MANIFEST","BILLING","known"),("CUSTOMS_X","ROUTE_CORE","known"),("TELEMETRY","DISPATCH_LOG","known"),("DISPATCH_LOG","DELAY_CODES","audit"),
    ("CAPACITY","ROUTE_CORE","audit"),("LOAD_BALANCE","CAPACITY","audit"),("SLA_FLAGS","TIME_WINDOWS","audit"),("BILLING","INVOICE_RUN","audit"),
    ("CUSTOMS_X","NORTHERN_GATE","audit"),("FUEL_ROUTE","ROUTE_CORE","audit"),("DEPOT_QUEUE","MANIFEST","audit"),("CUSTOMER_FEED","INVOICE_RUN","audit"),
    ("LEDGER_SYNC","CUSTOMS_X","oral-or-map"),("LEDGER_SYNC","BILLING","oral-or-map"),("PATCH_2003","LEDGER_SYNC","oral"),("BORDER_FALLBACK","NORTHERN_GATE","oral"),
]
put("dependencies.json",dict(nodes=nodes,edges=[dict(source=a,target=b,discovery=c) for a,b,c in edges]))
put("tapes.json",[
    dict(id="batch",title="The nightly batch",requires="always",line="The nightly batch clears overrides. I never liked that.",soWhat="Why dispatchers fight the system."),
    dict(id="road",title="The missing source",requires="rapport30",line="The road table? Nobody has the source anymore.",soWhat="A 2019 road rule still drives today's routes."),
    dict(id="border",title="Two in the morning",requires="border-or-rapport55",line="The two a.m. job writes customs codes. Billing reads them too.",soWhat="LEDGER_SYNC feeds routing and billing."),
])
deliveries=[]
for i in range(40):
    cause=["road","override","window","other"][i%4]
    deliveries.append(dict(id=f"D{4401+i}",planned=round(8.1+i*.24,2),actual=round(8.1+i*.24+(0 if cause=="other" else [.8,1.3,1.7][i%3]),2),cause=cause,location=["North gate","Depot 2","City ring","East yard"][i%4],late=i%4!=3))
put("deliveries.json",deliveries)
events=[]
for i in range(27):
    chapter=1 if i<9 else 2 if i<18 else 3
    events.append(dict(id=f"E{i+1:02d}",chapter=chapter,speaker=["renata","oswald","leif","cora","isaac","alistair"][i%6],condition=["always","thread-known","thread-unknown","ops","finance","shadow","overnight","friction-high","parity-low"][i%9],text=[
        "A depot asks which route is the source of truth.",
        "The overnight file is still moving.",
        "A driver has a map and a different road.",
        "The board asks what you proved.",
        "Finance wants a date with the number.",
        "The old route remains in the morning queue.",
    ][i%6]))
put("events/deck.json",events)
put("templates.json",dict(slots=["week","parity","mandate","friction","finding","reason","ally"],variants={
    "warm":["Week {week}. The {finding} changed my mind.","Parity {parity}. That is a measured sample."],
    "neutral":["Mandate {mandate}; friction {friction}.","The {ally} choice changes who carries the work."],
    "cold":["You wrote “{reason}”. Show the route.","A lower parity is a decision, too."],
}))

def line(speaker,text,expression="neutral",clip=None):
    assert len(text.split()) < 14, text
    return dict(speaker=speaker,text=text,expression=expression,clip=clip)

scene_defs = [
 ("S00","ENTR","dispatch","Ring the bell",[],[]),
 ("S01","CINEMA","dispatch","Meet the company",[],[line("narrator","Granger and Sons Freight. One hundred twelve years of deliveries."),line("narrator","A brass bell opens every shift."),line("narrator","Peak season starts in nine weeks.")]),
 ("S02","TOOL","dispatch","Sort the first late delivery",["sort"],[line("renata","Every late truck has a story. The pattern is the problem.","thinking")]),
 ("S03","FACE","board","Answer Cora",["reply"],[line("cora","Cora. Operations. Welcome to Granger."),line("cora","Peak is in nine weeks. Nothing breaks before then.","pressured")]),
 ("S04","FACE","server","Ask Oswald",["question"],[line("oswald","I built GRID-3. Back in ninety-four."),line("oswald","Everyone wants it gone. Nobody asks how it works.","thinking")]),
 ("S05","FACE","depot","Choose who to walk with",["walk"],[line("renata","My drivers are late. I'm the one explaining.","pressured"),line("leif","I can rebuild routing. If someone lets me.","approving")]),
 ("S06","DAYZERO","dispatch","Practise the four tools",["practice"],[line("coach","Practice first. Nothing here counts."),line("coach","That is the loop. The real clock starts now.","approving")]),
 ("S07","DESK","dispatch","Choose your first stops",["planner"],[line("cora","Six attention this week. Find what causes the delay.","thinking")]),
 ("S08","TOOL","depot","Mark three mismatches",["reel"],[line("renata","Scrub the day. Mark where the plan and road disagree.")]),
 ("S09","TOOL","server","Ask for the tapes",["tape"],[line("oswald","Ask your question. I'll answer what I remember.")]),
 ("S10","MAP","server","Trace what breaks",["map"],[line("leif","Place what we know. See what breaks if we move it.","pressured")]),
 ("S11","FACE","board","Choose the chapter move",["move"],[line("alistair","Cora tells me you have been busy."),line("alistair","Tell me a story. What is wrong with my system?","thinking")]),
 ("S12a","TOOL","server","Build the replacement sample",["poc"],[line("leif","Two weeks. I'll show you something.","approving")]),
 ("S12b","FACE","board","Present three evidence cards",["board"],[line("alistair","Show me.")]),
 ("S13","FACE","dispatch","Read what your move changed",["consequence"],[line("narrator","The story now belongs to the people who heard it.")]),
 ("S14","CINEMA","dispatch","Enter Chapter 2",[],[line("narrator","Week four. The coalition war begins.")]),
 ("S15","TOOL","board","Choose who carries the proposal",["coalition"],[line("renata","Ops will back you. We feel the pain daily."),line("isaac","Finance will fund it. Show me the cost of failure.","thinking")]),
 ("S16","TOOL","server","Plan the migration waves",["migration"],[line("leif","Waves, not a leap. Pick the order."),line("oswald","Move the night jobs last. Please.","thinking")]),
 ("S17","FACE","board","Read the coalition cost",["consequence"],[line("cora","The board approved. Don't waste that trust.","thinking")]),
 ("S18","CINEMA","night","Enter cutover week",[],[line("narrator","Week eight. The dispatch bell rings after dark.")]),
 ("S19","TOOL","night","Prepare the guarded switch",["cutover"],[line("cora","Overnight, or in waves. I need an answer.","pressured")]),
 ("S20","CUTOVER","night","Watch five fleet moments",["fleet"],[line("leif","We're live.","pressured"),line("renata","Trucks are moving.")]),
 ("S21","CINEMA","night","Read the outcome",["outcome"],[line("narrator","The maps settle. The consequences do not.")]),
 ("S22","FACE","dispatch","Choose what happens next",["final"],[line("oswald","Keep the night jobs documented."),line("renata","Fix the driver app next."),line("isaac","Publish the savings.")]),
 ("S23","REVIEW","dispatch","Trace, compare and reflect",["review"],[line("narrator","The fleet remembers what the plan forgot.")]),
]
for sid,kind,background,goal,tools,lines in scene_defs:
    put(f"scenes/{sid}.json",dict(id=sid,type=kind,background=background,goal=goal,tools=tools,lines=lines))
put("scenes/index.json", [dict(id=sid,type=kind,background=background,goal=goal,tools=tools,lines=lines) for sid,kind,background,goal,tools,lines in scene_defs])

extra=[
 ("renata","Finally someone says it.","approving"),("renata","Half of it, yes.","thinking"),("renata","It rained everywhere. Only we were late.","annoyed"),("renata","Honest. Go look.","approving"),
 ("cora","Good.","approving"),("cora","Show me. Quietly.","thinking"),("cora","Not before peak.","annoyed"),
 ("oswald","The night jobs. Nobody reads them.","approving"),("oswald","The nightly batch clears overrides. I never liked that.","thinking"),
 ("oswald","The road table? Nobody has the source anymore.","thinking"),("oswald","The two a.m. job writes customs codes. Billing reads them too.","thinking"),
 ("leif","If we replace routing and skip that job, invoices break.","thinking"),
 ("cora","You went over my head.","annoyed"),("leif","Two weeks. I'll show you something.","approving"),("oswald","Come. I'll show you where it breathes.","approving"),
 ("leif","Invoices won't match. I don't know why.","pressured"),("alistair","That is a good ledger. Cora, fund it.","thinking"),("alistair","Stories, not facts.","annoyed"),
 ("isaac","I have a budget meeting. You gave me a headline.","annoyed"),("oswald","Leif's side project. Interesting. Not told to me.","pressured"),("oswald","You listen. That is rare.","approving"),
 ("renata","My depots will pilot.","approving"),("isaac","No budget until you show me the number.","annoyed"),("isaac","Funded.","approving"),("renata","You never asked us.","annoyed"),
 ("oswald","You did not skip the night jobs. Thank you.","approving"),("oswald","My father drove one of these routes. Go gently.","approving"),
 ("renata","Nine hundred trucks. No routes.","pressured"),("isaac","Two systems. Two bills. Every day a fight.","annoyed"),("oswald","It breathes. Good.","approving"),
 ("cora","The fleet is moving. I did not sleep.","approving"),("oswald","Ask me something else.","neutral"),("leif","Parity is measured on a sample, not a promise.","thinking"),
]
dialogue=[]
for sid,kind,background,goal,tools,lines in scene_defs:
    for i,item in enumerate(lines):
        dialogue.append(dict(id=f"{sid}-{i}",**item))
for i,(speaker,text,expression) in enumerate(extra):
    dialogue.append(dict(id=f"reaction-{i:02d}",speaker=speaker,text=text,expression=expression))
put("dialogue.json",dialogue)
print("Legacy Fracture generated:",len(scene_defs),"scenes,",len(nodes),"nodes,",len(edges),"edges,",len(deliveries),"deliveries,",len(dialogue),"short voice lines.")
