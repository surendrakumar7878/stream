import React, { useEffect, useState, useRef } from 'react';
import { UserPlus, Gift } from 'lucide-react';
import type { StreamUser, Stream } from '../types';
import axios from 'axios';
import { BASE_URL } from '@/constants';

interface StreamDetailsModalProps {
  stream: Stream | null;
  onClose: () => void;
  onLuckyDraw: () => void;
}

const StreamDetailsModal: React.FC<StreamDetailsModalProps> = ({
  stream,
  onClose,
  onLuckyDraw
}) => {
  const [participants, setParticipants] = useState<StreamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    if (!stream) return;

    // Reset state immediately on stream change
    setParticipants([]);
    setLoading(true);
    isFirstLoad.current = true;

    const fetchParticipants = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/admin/stream/participants`, { id: stream.id });
        if (res.data.success) {
          setParticipants(res.data.stream.participants || []);
        }
      } catch (err) {
        console.error("Failed to fetch participants:", err);
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetchParticipants(); // Initial fetch
    intervalRef.current = setInterval(fetchParticipants, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stream?.id]);

  if (!stream) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold">{stream.title}</h2>
            <p className="text-gray-400">{participants.length} participants</p>
          </div>
          <div className="flex items-center gap-3">
            {stream.status !== 'running' && participants.length > 0 && (
              <button
                onClick={onLuckyDraw}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm lg:text-base"
              >
                <Gift className="w-4 h-4" />
                Lucky Draw
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors text-sm lg:text-base"
            >
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading participants...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No participants yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map((user) => (
              <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm lg:text-base truncate">{user.name}</h4>
                    <p className="text-xs lg:text-sm text-gray-400 truncate">{user.upi}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Joined: {formatDate(user.joinedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamDetailsModal;
