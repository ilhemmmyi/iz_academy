import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

export function AdminEditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/admin/courses/${id}`, { replace: true });
  }, [id, navigate]);
  return null;
}
