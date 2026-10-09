// Artistic hypotheses, not scientific one-to-one material/chord laws.
// Known demo metadata is explicit; arbitrary uploads are not semantically labelled.
export const materialPalettes = {
  paper:{lead:'paperPluck',harmony:'paperKeys',groove:'wood',hold:.55,chords:[[0,2,4],[5,7,9],[1,3,5],[4,6,8],[3,5,7],[1,3,5],[4,6,8],[0,2,4]]},
  wood:{lead:'marimba',harmony:'paperKeys',groove:'wood',hold:.35,chords:[[0,2,4],[3,5,7],[0,2,4],[4,6,8],[5,7,9],[3,5,7],[4,6,8],[0,2,4]]},
  watercolor:{lead:'feltKeys',harmony:'softPad',groove:'soft',hold:1.4,chords:[[0,2,4,8],[3,5,7,9],[1,3,5,7],[4,7,8],[5,7,9,11],[3,5,7,9],[4,6,8],[0,2,4,8]]},
  oil:{lead:'warmReed',harmony:'softPad',groove:'soft',hold:1.1,chords:[[0,2,4,6],[5,7,9,11],[3,5,7,9],[4,6,8],[2,4,6,8],[1,3,5,7],[4,6,8],[0,2,4]]},
  cloth:{lead:'feltKeys',harmony:'softPad',groove:'soft',hold:1.2,chords:[[0,2,4],[0,3,4],[5,7,9],[3,5,7],[0,2,4],[1,3,5],[4,7,8],[0,2,4]]},
  leaf:{lead:'warmReed',harmony:'paperKeys',groove:'organic',hold:.8,chords:[[0,2,4,8],[1,3,5],[3,5,7],[4,7,8],[5,7,9],[1,3,5],[4,6,8],[0,2,4,8]]},
  crayon:{lead:'bell',harmony:'paperKeys',groove:'pop',hold:.8,chords:[[0,2,4],[3,5,7],[1,3,5],[4,6,8],[5,7,9],[3,5,7],[4,6,8],[0,2,4]]},
  graphic:{lead:'musicBox',harmony:'paperKeys',groove:'swing',hold:.6,chords:[[0,2,4,5],[5,7,9],[1,3,5],[4,6,8],[3,5,7],[1,3,5],[4,6,8],[0,2,4]]},
  clay:{lead:'marimba',harmony:'softPad',groove:'organic',hold:.7,chords:[[0,2,4],[5,7,9],[2,4,6],[6,8,10],[3,5,7],[1,3,5],[4,6,8],[0,2,4]]},
};
export const demoMaterials={scribble:'crayon',building:'paper',decorative:'graphic',tiedye:'clay'};
export const demoSubjects={
  scribble:[{label:'飞翔人物',x:.46,y:.28,voice:'heroLead',kind:'theme'},{label:'举手的孩子们',x:.51,y:.76,voice:'warmReed',kind:'answer'}],
  building:[{label:'纸屋群',x:.5,y:.5,voice:'paperPluck',kind:'theme'}],
  decorative:[{label:'小羊',x:.5,y:.48,voice:'musicBox',kind:'theme'}],
  tiedye:[{label:'指纹旋转图案',x:.5,y:.5,voice:'marimba',kind:'theme'}],
};
