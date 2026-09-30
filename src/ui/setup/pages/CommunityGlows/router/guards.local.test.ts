import { describe, it, expect, vi, beforeEach } from 'vitest'
const auth=vi.hoisted(()=>({authBootstrapError:{value:null as unknown},isAuthenticated:{value:false},isAuthLoading:{value:false},isSessionLocked:{value:false}}))
vi.mock('@/lib/convexAuth',()=>auth)
import {authGuard} from './guards'
vi.mock('@/lib/localKanbanPreference', () => ({
 prefersLocalKanban: vi.fn(() => false), rememberLocalKanban: vi.fn(),
}))
import { prefersLocalKanban, rememberLocalKanban } from '@/lib/localKanbanPreference'
describe('guest route boundary',()=>{
 beforeEach(()=>{vi.mocked(prefersLocalKanban).mockReturnValue(false);vi.mocked(rememberLocalKanban).mockClear();auth.isAuthenticated.value=false;auth.isAuthLoading.value=false;auth.authBootstrapError.value=null;auth.isSessionLocked.value=false})
 it('remembers explicit local entry and reopens it without an account prompt', async()=>{
  const next=vi.fn()
  await authGuard({path:'/local-kanban',meta:{}} as never,{} as never,next)
  expect(rememberLocalKanban).toHaveBeenCalledOnce()
  vi.mocked(prefersLocalKanban).mockReturnValue(true)
  next.mockClear()
  await authGuard({path:'/tasks',meta:{requiresAuth:true},query:{url:'https://example.com'},hash:''} as never,{} as never,next)
  expect(next).toHaveBeenCalledWith({path:'/local-kanban',query:{url:'https://example.com'},hash:''})
 })
 it('keeps account tasks and other protected routes guarded',async()=>{
  vi.mocked(prefersLocalKanban).mockReturnValue(true)
  const next=vi.fn()
  await authGuard({path:'/twitter',meta:{requiresAuth:true}} as never,{} as never,next)
  expect(next).toHaveBeenCalledWith(expect.objectContaining({path:'/login'}))
  next.mockClear();auth.isAuthenticated.value=true;auth.isSessionLocked.value=true
  await authGuard({path:'/tasks',meta:{requiresAuth:true}} as never,{} as never,next)
  expect(next).toHaveBeenCalledWith('/session-lock')
 })
 it('allows only isolated local Kanban while protected tasks remain guarded',async()=>{
  const next=vi.fn();await authGuard({path:'/local-kanban',meta:{}} as never,{} as never,next);expect(next).toHaveBeenCalledWith()
  next.mockClear();await authGuard({path:'/tasks',meta:{requiresAuth:true},name:'Tasks'} as never,{} as never,next);expect(next).toHaveBeenCalledWith(expect.objectContaining({path:'/login'}))
 })
 it('keeps local access independent of auth loading and failure',async()=>{
  auth.isAuthLoading.value=true;auth.authBootstrapError.value=new Error('unavailable');const next=vi.fn()
  await authGuard({path:'/local-kanban',meta:{}} as never,{} as never,next);expect(next).toHaveBeenCalledWith()
 })
 it.each(['reconnect', 'unavailable'])('keeps explicit %s login recovery reachable for a restored session', async (access) => {
  auth.isAuthenticated.value = true
  const next = vi.fn()
  await authGuard({ path: '/login', query: { access }, meta: {} } as never, {} as never, next)
  expect(next).toHaveBeenCalledExactlyOnceWith()
 })
})
