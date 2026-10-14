import subprocess, json, os, numpy as np, soundfile as sf
T=json.load(open('../../src/data/timeline.json'))['dialogue']
C={'bulldog':["Grandpa (French (France))","Rocko (French (France))","Eddy (French (France))","Jacques","Thomas","Ralph","Fred","Grandpa (English (US))"],
   'mouse':["Flo (English (US))","Shelley (English (US))","Sandy (English (US))","Kathy","Junior","Shelley (French (France))","Flo (French (France))","Samantha"],
   'announcer':["Daniel","Thomas","Eddy (French (France))","Reed (English (UK))","Grandpa (English (UK))","Rocko (French (France))"]}
os.makedirs('audition',exist_ok=True)
def trimdur(p):
    d,r=sf.read(p); a=np.abs(d); thr=0.01*a.max(); idx=np.where(a>thr)[0]; return (idx[-1]-idx[0])/r
for ch,vs in C.items():
    for v in vs:
        row=[]
        for L in T:
            if L['char']!=ch: continue
            p=f"audition/{ch}_{v.split(' ')[0]}_{v[-8:-2].replace(' ','').replace('(','')}_{L['id']}.wav"
            subprocess.run(['say','-v',v,'--data-format=LEI16@48000','-o',p,L['text']],check=True)
            d=trimdur(p); w=(L['maxEnd']-L['start'])/24
            row.append(f"{L['id']}:{d:.2f}/{w:.2f}")
        print(ch, v, ' '.join(row))
