type EmailKind='verify'|'reset';
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** No tracking pixels, arbitrary HTML or remote font dependencies in account mail. */
export function authEmail(kind:EmailKind,url:string){
 const link=new URL(url);
 if(!['http:','https:'].includes(link.protocol)||link.username||link.password)throw Error('Invalid account email link.');
 const reset=kind==='reset',subject=reset?'Reset your PMForge password':'Verify your PMForge email';
 const title=reset?'A fresh start.':'Your next good decision starts here.';
 const copy=reset?'Use this single-use link to choose a new password. It expires in 30 minutes.':'Verify your email to finish creating your PMForge workspace. This link expires in one hour.';
 const action=reset?'Reset password':'Verify email';
 const note=reset?'If you did not request this, ignore this email. Your password stays the same.':'If you did not create this account, ignore this email.';
 const safe=escape(link.href),logo=escape(new URL('/brand/pmforge-mark.png',link.origin).href);
 return {subject,text:`${copy}\n${link.href}\n${note}\nPMForge - A practice ground for product minds.`,html:`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${subject}</title></head><body style="margin:0;padding:24px 12px;background:#f5f1e6;color:#203d2d;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;border:1px solid #d1d6c7;background:#fffdf5;border-radius:8px;overflow:hidden"><div style="padding:28px 32px;border-bottom:1px solid #d1d6c7"><img src="${logo}" width="36" height="36" alt="" style="vertical-align:middle;margin-right:10px"><strong style="font-size:24px;letter-spacing:-1px;vertical-align:middle">PMForge</strong></div><div style="padding:32px"><p style="font-size:12px;letter-spacing:2px;color:#5d6c58">YOUR WORKSPACE</p><h1 style="font:normal 34px/1.15 Georgia,serif;margin:18px 0 24px">${title}</h1><p style="font-size:16px;line-height:1.7">${copy}</p><p style="margin:28px 0"><a href="${safe}" style="display:inline-block;background:#203d2d;color:#fff8e8;padding:14px 24px;border-radius:4px;text-decoration:none;font-size:16px;font-weight:bold">${action} &rarr;</a></p><p style="font-size:14px;line-height:1.7">${note}</p><hr style="border:0;border-top:1px solid #d1d6c7;margin:28px 0"><p style="font-size:13px;line-height:1.7">Button not working? Copy this link into your browser:<br><a href="${safe}" style="color:#203d2d;word-break:break-all">${safe}</a></p></div><div style="padding:20px 32px;background:#f6e7a8;font-size:13px;line-height:1.7">A practice ground for product minds.<br>This is an account message, not a marketing subscription.</div></div></body></html>`};
}
