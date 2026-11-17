import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Calendar, Video, Clock, UserCheck } from 'lucide-react';

const InternPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intern/presentations/');
      setPresentations((d => Array.isArray(d) ? d : [])(res.data?.results ?? res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">Scheduled Project Presentations</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review upcoming demo sessions with your mentor. Changes or rescheduled dates will be reflected here in real time.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading presentations...</div>
      ) : presentations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
          No presentations scheduled yet. Your mentor will schedule presentation slots for completed or submitted projects.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {presentations.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                    p.status === 'RESCHEDULED' ? 'bg-amber-50 text-amber-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {p.status}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>Mentor: {p.mentor_name}</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base">{p.project_title}</h3>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-around text-xs">
                  <div className="flex items-center space-x-1.5 text-gray-800 font-semibold">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>{p.presentation_date}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center space-x-1.5 text-gray-800 font-semibold">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{p.presentation_time}</span>
                  </div>
                </div>

                {p.notes && (
                  <p className="mt-3 text-xs text-gray-500 italic">
                    Agenda: "{p.notes}"
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <a
                  href={p.google_meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet Session</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternPresentations;
