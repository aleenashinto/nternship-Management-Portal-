import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  Users, Mail, Phone, MapPin, GraduationCap, CheckCircle2,
  Clock, Calendar, Award, ExternalLink, ArrowRight, FileCheck2
} from 'lucide-react';

const MentorInterns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Drawer / Modal
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [completingInternship, setCompletingInternship] = useState(false);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !selectedIntern) return;
    await api.post(`/mentor/interns/${selectedIntern.id}/notes/`, { content: noteInput });
    setNoteInput('');
    openInternProfile(selectedIntern);
  };

  const handleCompleteInternship = async () => {
    if (!selectedIntern) return;
    setCompletingInternship(true);
    try {
      await api.post(`/mentor/interns/${selectedIntern.id}/complete-internship/`, {});
      await openInternProfile(selectedIntern);
    } finally {
      setCompletingInternship(false);
    }
  };

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/interns/');
      setInterns((d => Array.isArray(d) ? d : [])(res.data?.results ?? res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const openInternProfile = async (intern) => {
    setSelectedIntern(intern);
    try {
      setProfileLoading(true);
      const res = await api.get(`/mentor/interns/${intern.id}/`);
      setProfileData(res.data);
    } catch (e) {
      alert('Error fetching intern profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">My Assigned Interns</h1>
        <p className="text-xs text-gray-500 mt-1">
          Exclusive access to interns assigned directly to your mentorship roster. View detailed performance profiles, submissions, and schedules.
        </p>
      </div>

      {/* Interns Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading your assigned interns...</div>
      ) : interns.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
          No interns currently assigned to you. The HR Manager can assign interns to your roster.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interns.map((intern) => (
            <div
              key={intern.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {intern.first_name ? intern.first_name[0] : intern.username[0].toUpperCase()}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    Active Intern
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base">
                  {intern.full_name || intern.username}
                </h3>
                <p className="text-xs text-gray-400 font-mono mb-4">@{intern.username}</p>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span>{intern.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span>{intern.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="w-3.5 h-3.5 mr-2 text-blue-600" />
                    <span className="truncate">{intern.education_qualification || 'Degree in progress'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openInternProfile(intern)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>View Full Profile & Scores</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Individual Intern Profile (Section 3.6 requirement) */}
      <Modal
        isOpen={!!selectedIntern}
        onClose={() => {
          setSelectedIntern(null);
          setProfileData(null);
        }}
        title={`Intern Profile: ${selectedIntern?.full_name || selectedIntern?.username}`}
        maxWidth="max-w-3xl"
      >
        {profileLoading || !profileData ? (
          <div className="p-8 text-center text-gray-500">Loading intern profile...</div>
        ) : (
          <div className="space-y-6">
            {/* Personal & Educational Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">FULL NAME</span>
                <span className="text-gray-900 font-bold text-sm">
                  {profileData.intern.full_name || profileData.intern.username}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">EMAIL</span>
                <span className="text-gray-900 font-medium">{profileData.intern.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">PHONE</span>
                <span className="text-gray-900 font-medium">
                  {profileData.intern.phone} {profileData.intern.phone2 ? `• ${profileData.intern.phone2}` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">EDUCATIONAL QUALIFICATION</span>
                <span className="text-gray-900 font-medium">
                  {profileData.intern.education_qualification || 'N/A'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block font-semibold mb-0.5">ADDRESS</span>
                <span className="text-gray-900 font-medium">{profileData.intern.address || 'N/A'}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="text-gray-400 block font-semibold mb-0.5">OVERALL INTERNSHIP & CERTIFICATE STATUS</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                    {profileData.certificate ? `CERTIFICATE ${profileData.certificate.status}` : 'ONGOING INTERNSHIP'}
                  </span>
                </div>
                {!profileData.certificate && (
                  <button
                    onClick={handleCompleteInternship}
                    disabled={completingInternship}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                  >
                    {completingInternship ? 'Completing...' : 'Mark Internship Completed & Request HR Certificate'}
                  </button>
                )}
              </div>
            </div>

            {/* Immutable Dated Mentor Notes */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Immutable Dated Mentor Notes</h4>
              <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="Add a permanent dated mentor observation or presentation remark..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs"
                />
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                  Add Note
                </button>
              </form>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {(profileData.notes || []).length === 0 ? (
                  <p className="text-xs text-gray-400">No mentor notes recorded yet.</p>
                ) : (
                  (profileData.notes || []).map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <b className="text-gray-700">{n.mentor_name}</b>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-800 mt-1">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Projects & Scores */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Assigned Projects & Evaluation History</span>
              </h4>

              {profileData.assignments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-gray-400 text-center">
                  No projects assigned to this intern yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 text-xs">{a.project_title}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Assigned: {a.assigned_date} • Due: {a.due_date}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            a.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                            a.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700' :
                            a.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {a.status}
                          </span>
                          {a.score !== null && (
                            <div className="text-xs font-bold text-emerald-700 mt-1">
                              Score: {a.score}/100
                            </div>
                          )}
                        </div>
                      </div>

                      {a.evaluation_notes && (
                        <div className="mt-2 text-xs text-gray-600 bg-slate-50 p-2 rounded-lg">
                          <span className="font-semibold text-gray-700">Remarks: </span>
                          {a.evaluation_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Presentations */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Presentation Schedules</span>
              </h4>

              {profileData.presentations.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-gray-400 text-center">
                  No presentations scheduled for this intern.
                </div>
              ) : (
                <div className="space-y-2">
                  {profileData.presentations.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{p.project_title}</div>
                        <div className="text-[11px] text-gray-400">
                          {p.presentation_date} at {p.presentation_time}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700">
                          {p.status}
                        </span>
                        <a
                          href={p.google_meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Join Meet
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MentorInterns;
