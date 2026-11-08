import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { companyRequest } from '../api/company'

export default function CompanySettingsPage() {
  const [company, setCompany] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [minimum, setMinimum] = useState('')
  const [maximum, setMaximum] = useState('')
  const [typeId, setTypeId] = useState('')
  const [remove, setRemove] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshRequired, setRefreshRequired] = useState(false)

  async function load(resetBudget = true) {
    const [record, types] = await Promise.all([companyRequest('/company/settings/'), companyRequest('/property-types/')])
    setCompany(record); setCatalog(types); setRefreshRequired(false)
    if (resetBudget) { setMinimum(record.budget?.minimum ?? ''); setMaximum(record.budget?.maximum ?? '') }
  }
  async function initialLoad() {
    setLoading(true); setError('')
    try { await load() } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { initialLoad() }, [])

  async function mutate(path, method, data, message) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await companyRequest(path, method, data)
      if (path === '/company/budget-range/') {
        setCompany(previous => ({ ...previous, budget: result.budget }))
      } else if (method === 'POST') {
        const added = catalog.find(type => type.id === Number(data.type_id))
        if (added) setCompany(previous => ({ ...previous, property_types: [...previous.property_types, added] }))
      } else if (method === 'DELETE') {
        const removedId = Number(path.split('/').filter(Boolean).at(-1))
        setCompany(previous => ({ ...previous, property_types: previous.property_types.filter(type => type.id !== removedId) }))
      }
      setNotice(message); setRemove(null); setTypeId('')
      try { await load(path === '/company/budget-range/') } catch (e) { setRefreshRequired(true); setError(`Change saved, but refresh failed: ${e.message}`) }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function retryRefresh() {
    setBusy(true); setError('')
    try { await load(false) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  function saveBudget(e) {
    e.preventDefault()
    if (minimum.trim() === '' || maximum.trim() === '' || !Number.isFinite(Number(minimum)) || !Number.isFinite(Number(maximum)) || Number(minimum) < 0 || Number(maximum) < Number(minimum)) {
      setError('Enter valid non-negative amounts. Minimum must not exceed maximum.'); return
    }
    mutate('/company/budget-range/', 'PATCH', { minimum, maximum }, 'Budget range saved.')
  }
  const choices = catalog.filter(t => !company?.property_types.some(selected => selected.id === t.id))
  return <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, color: '#e0e0e0' }}>
    <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Company settings</Typography>
    <Typography sx={{ mb: 2, color: '#ccc' }}>Company belongs to the authenticated designer. The menu selector does not change the signed-in account.</Typography>
    {refreshRequired && <Button disabled={busy} onClick={retryRefresh}>Retry refresh</Button>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    {loading ? <CircularProgress aria-label="Loading company settings" /> : !company ? <Button onClick={initialLoad}>Retry loading</Button> : <Stack spacing={3}>
      <Typography variant="h6" sx={{ color: '#fff' }}>{company.name}</Typography>
      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Supported property types</Typography>
        <Stack direction="row" useFlexGap gap={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {company.property_types.length === 0 && <Typography sx={{ color: '#ccc' }}>No property types selected.</Typography>}
          {company.property_types.map(t => <Chip key={t.id} label={t.name} disabled={busy} onDelete={() => setRemove(t)} sx={{ background: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }} />)}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField select label="Property type" value={typeId} onChange={e => setTypeId(e.target.value)} disabled={busy} sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { color: '#e0e0e0' }, '& .MuiInputLabel-root': { color: '#ccc' } }}>
            {choices.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={busy || !typeId} onClick={() => mutate('/company/property-types/', 'POST', { type_id: typeId }, 'Property type added.')}>Add type</Button>
        </Stack>
        {choices.length === 0 && <Typography sx={{ mt: 2, color: '#ccc' }}>No additional types available.</Typography>}
      </Paper>
      <Paper component="form" onSubmit={saveBudget} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Accepted renovation budget range</Typography>
        <Typography sx={{ mb: 2, color: '#ccc' }}>Amounts in SGD.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField required type="number" label="Min. Budget" value={minimum} onChange={e => setMinimum(e.target.value)} disabled={busy} slotProps={{ htmlInput: { min: 0, step: '0.01' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#e0e0e0' }, '& .MuiInputLabel-root': { color: '#ccc' } }} />
          <TextField required type="number" label="Max. Budget" value={maximum} onChange={e => setMaximum(e.target.value)} disabled={busy} slotProps={{ htmlInput: { min: 0, step: '0.01' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#e0e0e0' }, '& .MuiInputLabel-root': { color: '#ccc' } }} />
        </Stack>
        <Stack direction="row" gap={2} sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" disabled={busy}>Save budget</Button>
          <Button disabled={busy} onClick={() => { setMinimum(company.budget?.minimum ?? ''); setMaximum(company.budget?.maximum ?? ''); setError('') }}>Cancel changes</Button>
        </Stack>
      </Paper>
    </Stack>}
    <Dialog open={Boolean(remove)} onClose={() => !busy && setRemove(null)}>
      <DialogTitle>Remove supported property type?</DialogTitle>
      <DialogContent>Remove {remove?.name} from your company's supported types?</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setRemove(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={() => mutate(`/company/property-types/${remove.id}/`, 'DELETE', undefined, 'Property type removed.')}>Remove</Button></DialogActions>
    </Dialog>
  </Box>
}
