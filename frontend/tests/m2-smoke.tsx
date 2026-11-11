import { JSDOM } from 'jsdom'
import React from 'react'
import assert from 'node:assert/strict'
const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost:5173' })
for (const name of ['window','document','HTMLElement','Element','Node','DocumentFragment','MutationObserver','ShadowRoot','sessionStorage','localStorage','CustomEvent']) Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true})
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true})
globalThis.getComputedStyle=dom.window.getComputedStyle
globalThis.React=React
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const originalFetch=globalThis.fetch
const apiBase=process.env.M2_TEST_API || 'http://127.0.0.1:8000'
let failRefresh=false
// Real Django API; only a single GET failure is injected to test recovery.
globalThis.fetch=async (url, options)=>{
 const parsed=new URL(url)
 const path=parsed.pathname
 if(failRefresh && path==='/api/company/settings/') {failRefresh=false;throw new Error('Simulated refresh failure')}
 return originalFetch(apiBase+path+parsed.search,options)
}
const { render, screen, within, fireEvent, act }=await import('@testing-library/react')
async function waitFor(check) {
 let last
 for(let i=0;i<100;i++){try{check();return}catch(e){last=e;await act(async()=>{await new Promise(r=>setTimeout(r,30))})}}
 throw last
}
const { default: CompanySettingsPage }=await import('../src/pages/CompanySettingsPage.jsx')
setTimeout(()=>{console.error('UI smoke timed out');process.exit(1)},45000).unref()
const result=render(<CompanySettingsPage />)
await screen.findByText('Demo Studio');console.log('Loaded')
const min=screen.getByLabelText(/Min. Budget/),max=screen.getByLabelText(/Max. Budget/)
fireEvent.change(min,{target:{value:'30000'}})
fireEvent.change(max,{target:{value:'80000'}})
failRefresh=true
fireEvent.click(screen.getByRole('button',{name:'Save budget'}))
await screen.findByText(/Change saved, but refresh failed/);console.log('Saved; failure injected')
fireEvent.change(min,{target:{value:'35000'}})
fireEvent.click(screen.getByRole('button',{name:'Cancel changes'}))
assert.equal(Number(min.value),30000,'Cancel uses newly saved budget even when refresh fails')
console.log('Cancel checked');fireEvent.click(screen.getByRole('button',{name:'Retry refresh'}));console.log('Retry clicked')
await waitFor(()=>assert.ok(!screen.queryByText('Retry refresh'), 'Refresh completed'))
fireEvent.change(min,{target:{value:'32000'}})
console.log('Select type');fireEvent.mouseDown(screen.getByRole('combobox',{name:'Property type'}))
fireEvent.click(await screen.findByRole('option',{name:'HDB'}))
fireEvent.click(screen.getByRole('button',{name:'Add type'}))
await screen.findByText('Property type added.');console.log('Added')
await waitFor(()=>assert.equal(screen.getByRole('button',{name:'Save budget'}).disabled,false))
assert.equal(min.value,'32000','Type edits preserve unsaved budget')
const chip=screen.getByText('HDB').closest('.MuiChip-root')
fireEvent.click(chip.querySelector('.MuiChip-deleteIcon'))
const dialog=await screen.findByRole('dialog')
fireEvent.click(within(dialog).getByRole('button',{name:'Remove',exact:true}))
await screen.findByText('Property type removed.');console.log('Removed')
await waitFor(()=>assert.ok(!document.querySelector('[role=dialog]'), 'Dialog closed'))
const stored=await originalFetch(apiBase+'/api/company/settings/').then(r=>r.json())
assert.equal(stored.budget.minimum,'30000.00')
assert.equal(stored.budget.maximum,'80000.00')
assert.equal(stored.property_types.length,0)
const users=await originalFetch(apiBase+'/api/users/').then(r=>r.json())
const second=users.find(u=>u.username==='second_designer')
await act(async()=>window.dispatchEvent(new CustomEvent('designerChanged',{detail:String(second.id)})))
await screen.findByText('Second Studio')
assert.equal(screen.getByLabelText(/Min. Budget/).value,'')
fireEvent.change(screen.getByLabelText(/Min. Budget/),{target:{value:'50'}})
fireEvent.change(screen.getByLabelText(/Max. Budget/),{target:{value:'100'}})
fireEvent.click(screen.getByRole('button',{name:'Save budget'}))
await screen.findByText('Budget range saved.')
await waitFor(()=>assert.equal(screen.getByRole('button',{name:'Save budget'}).disabled,false))
const secondStored=await originalFetch(apiBase+'/api/company/settings/?designer_id='+second.id).then(r=>r.json())
assert.equal(secondStored.budget.minimum,'50.00')
const firstStored=await originalFetch(apiBase+'/api/company/settings/?designer_id='+process.env.M2_DEMO_DESIGNER_ID).then(r=>r.json())
assert.equal(firstStored.budget.minimum,'30000.00')
// Resolve a delayed old-company request after the new selection has loaded.
const workingFetch=globalThis.fetch
let releaseOld
const oldGate=new Promise(resolve=>{releaseOld=resolve})
globalThis.fetch=async (url,options)=>{
 const parsed=new URL(url)
 if(parsed.pathname==='/api/company/settings/' && parsed.searchParams.get('designer_id')===process.env.M2_DEMO_DESIGNER_ID) await oldGate
 return workingFetch(url,options)
}
await act(async()=>window.dispatchEvent(new CustomEvent('designerChanged',{detail:process.env.M2_DEMO_DESIGNER_ID})))
await act(async()=>window.dispatchEvent(new CustomEvent('designerChanged',{detail:String(second.id)})))
await screen.findByText('Second Studio')
await act(async()=>{releaseOld(); await new Promise(r=>setTimeout(r,150))})
assert.ok(screen.getByText('Second Studio'))
assert.equal(screen.queryByText('Demo Studio'),null)
globalThis.fetch=workingFetch
await act(async()=>window.dispatchEvent(new CustomEvent('designerChanged',{detail:'invalid'})))
await screen.findByText('Select a valid designer ID.')
assert.equal(screen.queryByRole('button',{name:'Save budget'}),null)
result.unmount()
console.log('PASS: real API load, save, refresh failure, cancel, retry, add/remove, unsaved input preservation, persisted values')
