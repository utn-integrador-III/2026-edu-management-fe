import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  getUsers,
  searchUsers,
  getUserDetails,
  createUser,
  updateUser,
  deactivateUser,
  linkParentStudent,
  getParentChildren,
  getMyChildren,
  getStudentSubjects,
  assignSubjects,
  removeSubjectFromStudent,
  listSubjects,
  createSubject,
  listGroups,
  getGroupDetails,
  uploadUsersCsv,
  uploadStudentsCsv,
  runUsersAutomation,
  runStudentsAutomation,
  saveAttendance,
  getAttendanceHistory,
  getStudentMonthlyAttendance,
  downloadAttendanceReportPdf,
  getStudentEvents,
  getGroupEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getNotifications,
  markNotificationRead
} from '../src/api/edu'

describe('Edu API Functions', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
    localStorage.setItem('educonecta_session', JSON.stringify({ token: 'test-token' }))
  })

  const standardHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token'
  }

  describe('1. Users Management', () => {
    it('getUsers queries users list with active/role filters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getUsers({ role: 'teacher', active: true })
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/?role=teacher&active=true', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('searchUsers searches users by query string', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await searchUsers('carlos')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/search?q=carlos', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('getUserDetails fetches details of a single user', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'usr-1' }) })
      const result = await getUserDetails('usr-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/usr-1', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual({ id: 'usr-1' })
    })

    it('createUser sends POST request to save new user data', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'usr-new' }) })
      const userData = { first_name: 'Ana', role: 'parent' }
      const result = await createUser(userData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify(userData)
      })
      expect(result).toEqual({ id: 'usr-new' })
    })

    it('updateUser sends PUT request to update user details', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'usr-1', first_name: 'Ana' }) })
      const updateData = { first_name: 'Ana', role: 'parent', active: true }
      const result = await updateUser('usr-1', updateData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/usr-1', {
        method: 'PUT',
        headers: standardHeaders,
        body: JSON.stringify(updateData)
      })
      expect(result).toEqual({ id: 'usr-1', first_name: 'Ana' })
    })

    it('deactivateUser sends DELETE request to disable user account', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'deactivated' }) })
      const result = await deactivateUser('usr-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/usr-1', {
        method: 'DELETE',
        headers: standardHeaders
      })
      expect(result).toEqual({ message: 'deactivated' })
    })

    it('linkParentStudent sends POST to relate parent with student', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      const result = await linkParentStudent('parent-1', 'student-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/parent-students', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify({ parent_id: 'parent-1', student_id: 'student-1' })
      })
      expect(result).toEqual({ ok: true })
    })

    it('getParentChildren lists students linked to a specific parent', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getParentChildren('parent-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/parents/parent-1/children', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('getMyChildren lists students linked to currently logged-in parent', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getMyChildren()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/my-children', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })
  })

  describe('2. Assignments & Subjects', () => {
    it('getStudentSubjects gets assigned subjects for student', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getStudentSubjects('student-1', '2026')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/student-1/subjects?period=2026', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('assignSubjects POSTs assignments block to student', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const list = [{ subject_id: 'sub-1', teacher_id: 't-1' }]
      const result = await assignSubjects('student-1', list)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/student-1/subjects', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify({ assignments: list })
      })
      expect(result).toEqual({})
    })

    it('removeSubjectFromStudent deletes single subject assignment', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const result = await removeSubjectFromStudent('student-1', 'sub-1', '2026')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/student-1/subjects/sub-1?period=2026', {
        method: 'DELETE',
        headers: standardHeaders
      })
      expect(result).toEqual({})
    })

    it('listSubjects fetches all available subjects', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await listSubjects()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/subjects', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('createSubject POSTs new subject fields', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const data = { name: 'Matemáticas', code: 'MAT-7', level: 'Septimo' }
      const result = await createSubject(data)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/subjects', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify(data)
      })
      expect(result).toEqual({})
    })

    it('listGroups fetches all group/sections', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await listGroups()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/groups', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('getGroupDetails fetches specific group configuration details', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const result = await getGroupDetails('grp-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/groups/grp-1/details', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual({})
    })
  })

  describe('3. CSV Uploads & Automations', () => {
    it('uploadUsersCsv uploads multipart file object', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ created: 5 }) })
      const mockFile = new File(['cédula;nombre'], 'users.csv', { type: 'text/csv' })
      const result = await uploadUsersCsv(mockFile)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/import/users', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: expect.any(FormData)
      })
      expect(result).toEqual({ created: 5 })
    })

    it('uploadStudentsCsv uploads student details csv', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ linked: 10 }) })
      const mockFile = new File(['cédula_estudiante;cédula_padre'], 'students.csv', { type: 'text/csv' })
      const result = await uploadStudentsCsv(mockFile)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/import/students', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: expect.any(FormData)
      })
      expect(result).toEqual({ linked: 10 })
    })

    it('runUsersAutomation runs local users csv automation trigger', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const result = await runUsersAutomation()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/automation/users', {
        method: 'POST',
        headers: standardHeaders
      })
      expect(result).toEqual({})
    })

    it('runStudentsAutomation runs local students csv automation trigger', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const result = await runStudentsAutomation()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/automation/students', {
        method: 'POST',
        headers: standardHeaders
      })
      expect(result).toEqual({})
    })
  })

  describe('4. Attendance', () => {
    it('saveAttendance saves attendance record entries', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const data = { date: '2026-08-12', group_id: 'g1', records: [] }
      const result = await saveAttendance(data)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/attendance', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify(data)
      })
      expect(result).toEqual({})
    })

    it('getAttendanceHistory reads history with filters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getAttendanceHistory({ date: '2026-08-12', group_id: 'g1' })
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/attendance?date=2026-08-12&group_id=g1', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('getStudentMonthlyAttendance returns statistics summary', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getStudentMonthlyAttendance('std-1', 8, 2026)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/attendance/students/std-1/monthly?month=8&year=2026', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('downloadAttendanceReportPdf fetches the report as a Blob with filters', async () => {
      const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
      mockFetch.mockResolvedValueOnce({ ok: true, blob: async () => mockBlob })
      const result = await downloadAttendanceReportPdf({ date: '2026-08-12', group_id: 'g1', subject_id: 'sub-1' })
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reports/groups/g1/attendance/pdf?year=2026&month=8', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toBe(mockBlob)
    })

    it('downloadAttendanceReportPdf throws with backend detail message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Reporte no disponible' })
      })
      await expect(downloadAttendanceReportPdf({ date: '2026-08-12', group_id: 'g1' }))
        .rejects.toThrow('Reporte no disponible')
    })
  })

  describe('5. Calendar Events', () => {
    it('getStudentEvents lists student relevant events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getStudentEvents('std-1', { month: 8, year: 2026 })
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/calendar/students/std-1/events?month=8&year=2026', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('getGroupEvents lists group relevant events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
      const result = await getGroupEvents('g-1', { month: 8, year: 2026 })
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/calendar/events?group_id=g-1&month=8&year=2026', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([])
    })

    it('createEvent registers new events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const eventData = { title: 'Charla', group_id: 'g-1' }
      const result = await createEvent(eventData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/calendar/events', {
        method: 'POST',
        headers: standardHeaders,
        body: JSON.stringify(eventData)
      })
      expect(result).toEqual({})
    })

    it('updateEvent sends PUT request to update event details', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const eventData = { title: 'Charla Editada' }
      const result = await updateEvent('evt-1', eventData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/calendar/events/evt-1', {
        method: 'PUT',
        headers: standardHeaders,
        body: JSON.stringify(eventData)
      })
      expect(result).toEqual({})
    })

    it('deleteEvent sends DELETE request to remove event', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      const result = await deleteEvent('evt-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/calendar/events/evt-1', {
        method: 'DELETE',
        headers: standardHeaders
      })
      expect(result).toEqual({})
    })
  })

  describe('6. Notifications', () => {
    it('getNotifications lists reminders and maps read to is_read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'n1', title: 'Evt 1', read: true },
          { id: 'n2', title: 'Evt 2', read: false }
        ]
      })
      const result = await getNotifications()
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/notifications/', {
        method: 'GET',
        headers: standardHeaders
      })
      expect(result).toEqual([
        { id: 'n1', title: 'Evt 1', read: true, is_read: true },
        { id: 'n2', title: 'Evt 2', read: false, is_read: false }
      ])
    })

    it('getNotifications throws with backend detail message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Servicio no disponible' })
      })
      await expect(getNotifications()).rejects.toThrow('Servicio no disponible')
    })

    it('markNotificationRead sends PUT request to mark reminder as read', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'notif-1', read: true }) })
      const result = await markNotificationRead('notif-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read', {
        method: 'PUT',
        headers: standardHeaders
      })
      expect(result).toEqual({ id: 'notif-1', read: true })
    })

    it('markNotificationRead throws with backend detail message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Notificación no encontrada' })
      })
      await expect(markNotificationRead('bad-id')).rejects.toThrow('Notificación no encontrada')
    })
  })
})
