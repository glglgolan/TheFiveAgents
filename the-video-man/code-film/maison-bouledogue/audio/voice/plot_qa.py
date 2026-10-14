import json, sys, numpy as np, soundfile as sf, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
T={t['id']:t for t in json.load(open('src/data/dialogue_timing.json'))}
V=json.load(open('src/data/visemes.json'))
ids=sys.argv[1:] or ['L02','L05']
fig,axs=plt.subplots(len(ids),1,figsize=(16,4*len(ids)))
for ax,i in zip(np.atleast_1d(axs),ids):
    t=T[i]; d,r=sf.read(f'public/audio/voice/{i}.wav'); d=d if d.ndim==1 else d[:,0]
    fr=t['start']+np.arange(len(d))/r*24
    ax.plot(fr,d,lw=.4,color='k'); ax.set_xlim(t['start']-3,t['maxEnd']+2)
    ax.axvline(t['maxEnd'],color='r'); ax.axvline(t['end'],color='g',ls='--')
    for w,s,e in t['words']:
        ax.axvspan(s,e,color='C0',alpha=.12); ax.text(s,-.95,w,fontsize=9,color='C0')
    for f,sh in V[t['char']]:
        if t['start']-2<=f<=t['maxEnd']:
            ax.axvline(f,color='C1',lw=.6); ax.text(f+.1,.85,sh,fontsize=11,color='C1',weight='bold')
    ax.set_ylim(-1,1); ax.set_title(f"{i} {t['char']} '{t['text']}'  end={t['end']} maxEnd={t['maxEnd']} (visemes 1f early)")
    ax.set_xlabel('film frame')
plt.tight_layout(); plt.savefig('audio/voice/qa/visemes_'+'_'.join(ids)+'.png',dpi=70)
