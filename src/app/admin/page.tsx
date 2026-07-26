'use client';

import { useState, useEffect, useCallback } from 'react';

import { motion } from 'framer-motion';
import Image from 'next/image';
import AdminRoute from '@/components/auth/AdminRoute';
import { Plus, Edit, Trash2, Save, X, Map, Clock, Users, CheckCircle, Calendar, User as UserIcon, AlertCircle, Copy, User, ChevronUp, ChevronDown, Gift } from 'lucide-react';
import { validateEmailFormat } from '@/utils/emailValidation';
import { useDatabase, FarmItem, User as UserType } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import ExpansionIcon from '@/components/ui/ExpansionIcon';
import GW2Icon from '@/components/ui/GW2Icon';
import { usePageTitle } from '@/hooks/usePageTitle';
import MarkdownText from '@/components/ui/MarkdownText';
import RouteCardImageField from '@/components/farming-routes/RouteCardImageField';

type AdminSection = 'farms' | 'users' | 'pending-farms';

export default function AdminPanel() {
  const { dbService } = useDatabase();
  const { user, token } = useAuth();

  usePageTitle(
    user?.role === 'admin' ? 'pageTitles.admin' : 'pageTitles.moderation',
    user?.role === 'admin' ? 'Admin Panel' : 'Moderator Panel'
  );
  const [activeSection, setActiveSection] = useState<AdminSection>('farms');
  const [farms, setFarms] = useState<FarmItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingPendingFarms, setIsLoadingPendingFarms] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [pendingFarms, setPendingFarms] = useState<FarmItem[]>([]);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'moderator',
    isActive: true
  });
  const [editingFarm, setEditingFarm] = useState<FarmItem | null>(null);
  const [editingSelectedCurrencies, setEditingSelectedCurrencies] = useState<string[]>(['gold']);

  // Función para mover farm hacia arriba
  const moveFarmUp = async (farmId: string) => {
    const currentIndex = farms.findIndex(farm => farm.id === farmId);
    if (currentIndex <= 0) return; // Ya está en la parte superior

    const newFarms = [...farms];
    const farmToMove = newFarms[currentIndex];
    const farmAbove = newFarms[currentIndex - 1];

    // Intercambiar órdenes
    const tempOrder = farmToMove.order ?? currentIndex;
    farmToMove.order = farmAbove.order ?? currentIndex - 1;
    farmAbove.order = tempOrder;

    // Intercambiar posiciones en el array
    [newFarms[currentIndex], newFarms[currentIndex - 1]] = [newFarms[currentIndex - 1], newFarms[currentIndex]];

    setFarms(newFarms);

    // Actualizar en la base de datos
    try {
      await dbService.updateFarm(farmId, { order: farmToMove.order });
      await dbService.updateFarm(farmAbove.id, { order: farmAbove.order });
      console.log('Orden actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el orden:', error);
      // Revertir cambios en caso de error
      loadFarms();
    }
  };

  // Función para mover farm hacia abajo
  const moveFarmDown = async (farmId: string) => {
    const currentIndex = farms.findIndex(farm => farm.id === farmId);
    if (currentIndex >= farms.length - 1) return; // Ya está en la parte inferior

    const newFarms = [...farms];
    const farmToMove = newFarms[currentIndex];
    const farmBelow = newFarms[currentIndex + 1];

    // Intercambiar órdenes
    const tempOrder = farmToMove.order ?? currentIndex;
    farmToMove.order = farmBelow.order ?? currentIndex + 1;
    farmBelow.order = tempOrder;

    // Intercambiar posiciones en el array
    [newFarms[currentIndex], newFarms[currentIndex + 1]] = [newFarms[currentIndex + 1], newFarms[currentIndex]];

    setFarms(newFarms);

    // Actualizar en la base de datos
    try {
      await dbService.updateFarm(farmId, { order: farmToMove.order });
      await dbService.updateFarm(farmBelow.id, { order: farmBelow.order });
      console.log('Orden actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el orden:', error);
      // Revertir cambios en caso de error
      loadFarms();
    }
  };


  // Estados para crear farm
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['gold']);
  const [newFarm, setNewFarm] = useState({
    name: '',
    description: '',
    estimatedTime: '',
    estimatedGold: '',
    estimatedSpirit: '',
    estimatedRewards: {} as Record<string, string>,
    expansion: [] as ('core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')[],
    waypoint: '',
    locationImageUrl: '',
    isSolo: false,
    requiresSquad: false,
    createdBy: '',
    status: 'approved' as const,
    selected: false
  });

  const DESCRIPTION_MAX = 500;

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Helper functions for notifications
  const showSuccess = (title: string, message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title,
      message
    });
  };

  const showError = (title: string, message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title,
      message
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Función para formatear tiempo (HHMMSS -> HH:MM:SS)
  const formatTimeInput = (value: string): string => {
    // Solo permitir números
    const cleaned = value.replace(/[^\d]/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4)}`;

    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4, 6)}`;
  };



  // Manejar cambio de tiempo
  const handleTimeChange = (value: string, isEdit = false) => {
    // Obtener solo los números del valor actual (sin los dos puntos)
    const currentNumbers = value.replace(/[^\d]/g, '');

    // Limitar a 6 dígitos máximo
    if (currentNumbers.length > 6) return;

    const formatted = formatTimeInput(currentNumbers);
    if (isEdit && editingFarm) {
      setEditingFarm({ ...editingFarm, estimatedTime: formatted });
    } else {
      setNewFarm({ ...newFarm, estimatedTime: formatted });
    }
  };



  const copyWaypointToClipboard = async (waypoint: string) => {
    try {
      await navigator.clipboard.writeText(waypoint);
      showSuccess('Copiado', 'Waypoint copiado al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Error', 'No se pudo copiar el waypoint al portapapeles');
    }
  };

  // Función para formatear oro automáticamente mientras el usuario escribe
  const formatGoldInput = (value: string): string => {
    // Remover todo excepto números
    const numbersOnly = value.replace(/[^\d]/g, '');

    if (!numbersOnly) return '';

    // Padear con ceros a la izquierda para tener al menos 6 dígitos (GGSSCC)
    const paddedValue = numbersOnly.padStart(6, '0');

    // Interpretar como formato posicional: últimos 6 dígitos son GGSSCC
    const lastSixDigits = paddedValue.slice(-6);
    const gold = parseInt(lastSixDigits.slice(0, 2)) || 0;
    const silver = parseInt(lastSixDigits.slice(2, 4)) || 0;
    const copper = parseInt(lastSixDigits.slice(4, 6)) || 0;

    // Si hay más de 6 dígitos, los primeros son oro adicional
    if (paddedValue.length > 6) {
      const extraGoldDigits = paddedValue.slice(0, -6);
      const extraGold = parseInt(extraGoldDigits) || 0;
      const totalGold = extraGold * 100 + gold;

      const silverFormatted = silver.toString().padStart(2, '0');
      const copperFormatted = copper.toString().padStart(2, '0');
      return `${totalGold}g ${silverFormatted}s ${copperFormatted}c`;
    }

    // Construir el string formateado
    let result = '';
    if (gold > 0) {
      // Formatear con ceros a la izquierda cuando hay oro: 15g 00s 00c
      const silverFormatted = silver.toString().padStart(2, '0');
      const copperFormatted = copper.toString().padStart(2, '0');
      result += `${gold}g ${silverFormatted}s ${copperFormatted}c`;
    } else if (silver > 0) {
      // Para solo plata, usar padding: 00s 25c
      const copperFormatted = copper.toString().padStart(2, '0');
      result += `${silver.toString().padStart(2, '0')}s ${copperFormatted}c`;
    } else {
      // Para solo cobre: 00c
      result += `${copper.toString().padStart(2, '0')}c`;
    }

    return result.trim();
  };

  // Funciones para manejar cambios de monedas
  const handleCurrencyChange = (currency: string, value: string) => {
    // Formatear oro automáticamente
    let formattedValue = value;
    if (currency === 'gold' && value) {
      formattedValue = formatGoldInput(value);
    }

    setNewFarm({
      ...newFarm,
      estimatedRewards: {
        ...newFarm.estimatedRewards,
        [currency]: formattedValue
      }
    });
  };

  const handleEditingCurrencyChange = (currency: string, value: string) => {
    if (!editingFarm) return;

    // Formatear oro automáticamente
    let formattedValue = value;
    if (currency === 'gold' && value) {
      formattedValue = formatGoldInput(value);
    }

    setEditingFarm({
      ...editingFarm,
      estimatedRewards: {
        ...editingFarm.estimatedRewards,
        [currency]: formattedValue
      }
    });
  };

  const currencyOptions = [
    { value: 'gold', label: 'Oro', icon: 'gold' as const, placeholder: '150025' },
    { value: 'spiritShards', label: 'Spirit Shards', icon: 'spirit-shard' as const, placeholder: '25' },
    { value: 'karma', label: 'Karma', icon: 'karma' as const, placeholder: '5000' },
    { value: 'fractalRelics', label: 'Fractal Relics', icon: 'fractal-relic' as const, placeholder: '50' },
    { value: 'volatileMagic', label: 'Volatile Magic', icon: 'volatile-magic' as const, placeholder: '1000' },
    { value: 'unboundMagic', label: 'Unbound Magic', icon: 'unbound-magic' as const, placeholder: '1000' },
    { value: 'riftEssences', label: 'Rift Essences', icon: 'rift-essence' as const, placeholder: '25' },
    { value: 'mysticClovers', label: 'Mystic Clovers', icon: 'mystic-clover' as const, placeholder: '2' },
    { value: 'imperialFavor', label: 'Imperial Favor', icon: 'imperial-favor' as const, placeholder: '50' }
  ];



  // Manejar selección múltiple de expansiones
  const handleExpansionToggle = (expansionValue: 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe', isEdit = false) => {
    if (isEdit && editingFarm) {
      // Asegurar que expansion sea un array
      const currentExpansions = Array.isArray(editingFarm.expansion)
        ? editingFarm.expansion
        : [editingFarm.expansion];

      const newExpansions = currentExpansions.includes(expansionValue)
        ? currentExpansions.filter(exp => exp !== expansionValue)
        : [...currentExpansions, expansionValue];

      // Asegurar que al menos una expansión esté seleccionada
      if (newExpansions.length > 0) {
        setEditingFarm({ ...editingFarm, expansion: newExpansions });
      }
    } else {
      const currentExpansions = newFarm.expansion;
      const newExpansions = currentExpansions.includes(expansionValue)
        ? currentExpansions.filter(exp => exp !== expansionValue)
        : [...currentExpansions, expansionValue];

      // Asegurar que al menos una expansión esté seleccionada
      if (newExpansions.length > 0) {
        setNewFarm({ ...newFarm, expansion: newExpansions });
      }
    }
  };



  // Actualizar createdBy cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      setNewFarm(prev => ({
        ...prev,
        createdBy: user.id
      }));
    }
  }, [user?.id]);

  // Cargar farms
  const loadFarms = useCallback(async () => {
    if (!dbService) return;
    try {
      setIsLoading(true);
      const allFarms = await dbService.getAllFarms();
      // Solo mostrar farms aprobados en la sección "Farms"
      const approvedFarms = allFarms.filter((farm: FarmItem) => farm.status === 'approved');
      // Ordenar por el campo order (menor número = más arriba)
      const sortedFarms = approvedFarms.sort((a, b) => {
        const orderA = a.order ?? 999; // Si no tiene order, va al final
        const orderB = b.order ?? 999;
        return orderA - orderB;
      });
      setFarms(sortedFarms);
    } catch (err) {
      console.error('Error loading farms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dbService]);

  // Crear nuevo farm
  const handleCreateFarm = async () => {
    if (!dbService) return;

    // Validar campos requeridos
    if (!newFarm.name.trim() || !newFarm.description.trim() || !newFarm.estimatedTime.trim()) {
      showError('Error de Validación', 'Nombre, descripción y tiempo son campos requeridos');
      return;
    }

    // Verificar longitud de descripción
    if (newFarm.description.length > DESCRIPTION_MAX) {
      showError('Error de Validación', `La descripción no puede exceder ${DESCRIPTION_MAX} caracteres`);
      return;
    }

    // Verificar que al menos una recompensa esté especificada (formato antiguo o nuevo)
    const hasOldRewards = newFarm.estimatedGold?.trim() || newFarm.estimatedSpirit?.trim();
    const hasNewRewards = Object.values(newFarm.estimatedRewards).some(value => value && value.trim() !== '');

    if (!hasOldRewards && !hasNewRewards) {
      showError('Error de Validación', 'Debes especificar al menos una recompensa estimada');
      return;
    }

    try {
      await dbService.createFarm({
        ...newFarm,
        // Mapear nuevas recompensas a campos legacy para compatibilidad
        estimatedGold: newFarm.estimatedGold || newFarm.estimatedRewards.gold || '',
        estimatedSpirit: newFarm.estimatedSpirit || newFarm.estimatedRewards.spiritShards || '',
        createdByRole: 'admin',
        order: farms.length // Asignar order al final de la lista
      });

      // Limpiar formulario
      setNewFarm(prev => ({
        name: '',
        description: '',
        estimatedTime: '',
        estimatedGold: '',
        estimatedSpirit: '',
        estimatedRewards: {},
        expansion: [] as ('core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')[],
        isSolo: false,
        requiresSquad: false,
        waypoint: '',
        locationImageUrl: '',
        selected: false,
        status: 'approved',
        createdBy: user?.id || prev.createdBy
      }));

      setSelectedCurrencies(['gold']);
      setIsCreating(false);
      await loadFarms();

      showSuccess('¡Éxito!', `Farm "${newFarm.name}" creado exitosamente`);
    } catch (err) {
      console.error('Error creating farm:', err);
      showError('Error', 'Could not create the farm. Please try again.');
    }
  };

  // Actualizar farm
  const handleUpdateFarm = async () => {
    if (!editingFarm || !dbService) return;

    // Validar campos requeridos
    if (!editingFarm.name.trim() || !editingFarm.description.trim() || !editingFarm.estimatedTime.trim()) {
      showError('Validation Error', 'Name, description and time are required fields');
      return;
    }

    // Validar longitud de descripción
    if ((editingFarm.description || '').length > DESCRIPTION_MAX) {
      showError('Validation Error', `Description cannot exceed ${DESCRIPTION_MAX} characters`);
      return;
    }

    // Validar que al menos una recompensa esté presente
    const hasRewards = editingFarm.estimatedRewards &&
      Object.values(editingFarm.estimatedRewards).some((value: unknown) =>
        typeof value === 'string' && value.trim() !== ''
      );
    const hasLegacyRewards = editingFarm.estimatedGold?.trim() || editingFarm.estimatedSpirit?.trim();

    if (!hasRewards && !hasLegacyRewards) {
      showError('Validation Error', 'You must specify at least one reward type');
      return;
    }

    try {

      //   name: editingFarm.name,
      //   description: editingFarm.description,
      //   estimatedTime: editingFarm.estimatedTime,
      //   estimatedGold: editingFarm.estimatedGold,
      //   estimatedSpirit: editingFarm.estimatedSpirit,
      //   expansion: editingFarm.expansion,
      //   type: editingFarm.type
      // });

      await dbService.updateFarm(editingFarm.id, {
        name: editingFarm.name,
        description: editingFarm.description,
        estimatedTime: editingFarm.estimatedTime,
        estimatedGold: editingFarm.estimatedGold,
        estimatedSpirit: editingFarm.estimatedSpirit,
        estimatedRewards: editingFarm.estimatedRewards,
        expansion: editingFarm.expansion,
        isSolo: editingFarm.isSolo,
        requiresSquad: editingFarm.requiresSquad,
        waypoint: editingFarm.waypoint,
        locationImageUrl: editingFarm.locationImageUrl?.trim() || null
      });

      const farmName = editingFarm.name;
      setEditingFarm(null);
      await loadFarms();

      showSuccess('Updated!', `Farm "${farmName}" updated successfully`);
    } catch (err) {
      console.error('Error updating farm:', err);
      showError('Error', 'Could not update the farm. Please try again.');
    }
  };

  // Eliminar farm
  const handleDeleteFarm = async (id: string) => {
    if (!dbService) return;

    const farm = farms.find(f => f.id === id);
    const farmName = farm?.name || 'Farm';

    if (confirm(`¿Estás seguro de que quieres eliminar "${farmName}"?`)) {
      try {
        await dbService.deleteFarm(id);
        await loadFarms();

        showSuccess('¡Eliminado!', `Farm "${farmName}" eliminado correctamente`);
      } catch (err) {
        console.error('Error deleting farm:', err);
        showError('Error', 'No se pudo eliminar el farm. Intenta nuevamente.');
      }
    }
  };

  // Estados adicionales para usuarios (ya declarados arriba)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    if (!dbService) return;
    try {
      setIsLoadingUsers(true);
      const usersData = await dbService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [dbService]);

  // Crear usuario
  const handleCreateUser = async () => {
    if (!dbService) return;

    if (!newUser.email.trim() || !newUser.username.trim()) {
      showError('Validation Error', 'Email and username are required');
      return;
    }

    // Validación de email
    const emailValidation = validateEmailFormat(newUser.email);
    if (!emailValidation.isValid) {
      showError('Validation Error', emailValidation.message);
      return;
    }

    try {
      await dbService.createUser(newUser);
      const userName = newUser.username;
      setNewUser({
        email: '',
        username: '',
        role: 'user' as 'user' | 'admin' | 'moderator',
        isActive: true
      });
      setIsCreatingUser(false);
      await loadUsers();
      showSuccess('User created!', `User "${userName}" created successfully`);
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creating the user';
      showError('Error', errorMessage);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id: string) => {
    const userToDelete = users.find(user => user.id === id);
    if (userToDelete) {
      setUserToDelete(userToDelete);
      setShowDeleteModal(true);
    }
  };

  // Confirmar eliminación de usuario
  const confirmDeleteUser = async () => {
    if (!userToDelete || !dbService) return;

    try {
      const result = await dbService.deleteUser(userToDelete.id);
      await loadUsers();

      let successMessage = `User "${userToDelete.username}" has been deleted successfully.`;
      if (result.farmsPreserved > 0) {
        successMessage += ` ${result.farmsPreserved} farms have been preserved.`;
      } else {
        successMessage += ' There were no associated farms.';
      }

      // Nota: No es necesario invalidar la sesión aquí porque el usuario ya no existe en la BD
      // La próxima vez que el usuario intente acceder, la verificación de autenticación fallará

      showSuccess('Usuario eliminado', successMessage);
    } catch (err) {
      console.error('Error deleting user:', err);
      showError('Error deleting user', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Cambiar rol de moderador a usuario


  // Actualizar usuario
  const handleUpdateUser = async () => {
    if (!editingUser || !dbService) return;

    try {
      // Obtener el usuario actual para comparar cambios
      const currentUser = users.find(user => user.id === editingUser.id);
      const roleChanged = currentUser && currentUser.role !== editingUser.role;
      const isActiveChanged = currentUser && currentUser.isActive !== editingUser.isActive;

      await dbService.updateUser(editingUser.id, {
        email: editingUser.email,
        username: editingUser.username,
        role: editingUser.role,
        isActive: editingUser.isActive
      });

      // Invalidar sesión SOLO si el usuario fue desactivado
      if (isActiveChanged && !editingUser.isActive) {
        try {
          const reason = 'Usuario desactivado';
          await dbService.invalidateUserSession(editingUser.id, reason);
          showSuccess('Éxito', 'Usuario desactivado correctamente. La sesión del usuario ha sido invalidada.');
        } catch (invalidateError) {
          console.warn('No se pudo invalidar la sesión del usuario:', invalidateError);
          showSuccess('Éxito', 'Usuario actualizado correctamente.');
        }
      } else if (roleChanged) {
        // Solo informar que el rol cambió, pero NO invalidar la sesión
        showSuccess('Éxito', `Usuario actualizado correctamente. El rol ha cambiado a ${editingUser.role}.`);
      } else {
        showSuccess('Éxito', 'Usuario actualizado correctamente.');
      }

      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      showError('Error', 'No se pudo actualizar el usuario. Intenta nuevamente.');
    }
  };

  // Cargar farms pendientes
  const loadPendingFarms = useCallback(async () => {
    if (!dbService) return;

    try {
      setIsLoadingPendingFarms(true);
      const allFarms = await dbService.getAllFarms();
      const pendingFarms = allFarms.filter((farm: FarmItem) => farm.status === 'pending');




      setPendingFarms(pendingFarms);
    } catch (error) {
      console.error('Error loading pending farms:', error);
    } finally {
      setIsLoadingPendingFarms(false);
    }
  }, [dbService]);

  // Aprobar farm
  const handleApproveFarm = async (farmId: string) => {
    if (!dbService) return;

    try {
      await dbService.updateFarm(farmId, { status: 'approved' });
      await loadPendingFarms();
      showSuccess('¡Aprobado!', 'Farm aprobado correctamente');
    } catch (err) {
      console.error('Error approving farm:', err);
      showError('Error', 'No se pudo aprobar el farm. Intenta nuevamente.');
    }
  };

  // Rechazar farm (eliminar completamente)
  const handleRejectFarm = async (farmId: string) => {
    if (!dbService) return;

    try {

      await dbService.deleteFarm(farmId);
      await loadPendingFarms();
      showSuccess('¡Eliminado!', 'Farm rechazado y eliminado correctamente');
    } catch (err) {
      console.error('❌ Error rejecting farm:', err);
      showError('Error', 'No se pudo rechazar el farm. Intenta nuevamente.');
    }
  };

  // Función para limpiar farms rechazados existentes (one-time cleanup)
  const handleCleanupRejectedFarms = async () => {
    if (!dbService) return;

    try {
      setIsLoading(true);
      const allFarms = await dbService.getAllFarms();
      const rejectedFarms = allFarms.filter((farm: FarmItem) => farm.status === 'rejected');

      if (rejectedFarms.length === 0) {
        showSuccess('Limpieza completada', 'No hay farms rechazados para eliminar');
        return;
      }

      // Eliminar cada farm rechazado
      for (const farm of rejectedFarms) {
        await dbService.deleteFarm(farm.id);
      }

      showSuccess('Limpieza completada', `${rejectedFarms.length} farm(s) rechazado(s) eliminado(s) correctamente`);

      // Recargar datos
      await loadPendingFarms();

    } catch (err) {
      console.error('❌ Error durante la limpieza:', err);
      showError('Error', 'No se pudo completar la limpieza de farms rechazados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'farms') {
      loadFarms();
    } else if (activeSection === 'users') {
      loadUsers();
    } else if (activeSection === 'pending-farms') {
      loadPendingFarms();
    }
  }, [activeSection, loadFarms, loadUsers, loadPendingFarms]);

  // Cargar farms pendientes al inicio para mostrar el contador
  useEffect(() => {
    if (dbService) {
      loadPendingFarms();
    }
  }, [dbService, loadPendingFarms]);



  const renderFarmsManager = () => (
    <div className="space-y-6">
      {/* Create Farm Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gestión de Farms</h2>
        {!isCreating && !editingFarm && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Farm
          </button>
        )}
      </div>

      {/* Create Farm Modal */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Farm</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={newFarm.name}
                onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="Ej: Silverwastes RIBA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={newFarm.description}
                onChange={(e) => setNewFarm({ ...newFarm, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="Descripción del farm..."
                maxLength={DESCRIPTION_MAX}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{newFarm.description.length}/{DESCRIPTION_MAX}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tiempo Estimado
                </label>
                <input
                  type="text"
                  value={newFarm.estimatedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="010000 → 01:00:00"
                />
                <p className="text-xs text-gray-400 mt-1">6 dígitos: HHMMSS (ej: 013000 = 01:30:00)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Waypoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFarm.waypoint || ''}
                    onChange={(e) => setNewFarm({ ...newFarm, waypoint: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="[&AQAAAA==]"
                  />
                  <button
                    type="button"
                    onClick={() => newFarm.waypoint && copyWaypointToClipboard(newFarm.waypoint)}
                    disabled={!newFarm.waypoint}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                    title="Copiar waypoint"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Chat code del waypoint (opcional)</p>
              </div>
            </div>

            <RouteCardImageField
              value={newFarm.locationImageUrl || ''}
              onChange={(url) => setNewFarm({ ...newFarm, locationImageUrl: url })}
              token={token}
              farmName={newFarm.name}
            />

            {/* Checkboxes para Solo/Squad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFarm.isSolo}
                  onChange={(e) => setNewFarm({ ...newFarm, isSolo: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-white">Farm Solitario</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFarm.requiresSquad}
                  onChange={(e) => setNewFarm({ ...newFarm, requiresSquad: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-white">Requiere Squad</span>
              </label>
            </div>

            {/* Sistema de Monedas */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recompensas Estimadas (por hora)
              </label>

              {/* Tipos de Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tipos de Moneda
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currencyOptions.map((option) => (
                    <div key={option.value} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCurrencies.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCurrencies(prev => [...prev, option.value]);
                            } else {
                              setSelectedCurrencies(prev => prev.filter(c => c !== option.value));
                              setNewFarm(currentFarm => ({
                                ...currentFarm,
                                estimatedRewards: {
                                  ...currentFarm.estimatedRewards,
                                  [option.value]: ''
                                }
                              }));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <GW2Icon type={option.icon} size="sm" />
                        <span className="text-white text-sm flex-1 min-w-0">{option.label}</span>
                        <input
                          type={option.value === 'gold' ? 'text' : 'number'}
                          min={option.value === 'gold' ? undefined : '0'}
                          step={option.value === 'gold' ? undefined : '0.01'}
                          value={newFarm.estimatedRewards[option.value as keyof typeof newFarm.estimatedRewards] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (option.value === 'gold') {
                              const numbersOnly = value.replace(/[^\d]/g, '');
                              if (numbersOnly.length <= 10) {
                                handleCurrencyChange(option.value, numbersOnly);
                              }
                            } else if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                              handleCurrencyChange(option.value, value);
                            }
                          }}
                          className="w-24 sm:w-28 md:w-32 lg:w-36 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder={option.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Selecciona uno o más tipos de recompensa</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expansiones Requeridas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'core', label: 'Core Game' },
                  { value: 'hot', label: 'Heart of Thorns' },
                  { value: 'pof', label: 'Path of Fire' },
                  { value: 'eod', label: 'End of Dragons' },
                  { value: 'soto', label: 'Secrets of the Obscure' },
                  { value: 'jw', label: 'Janthir Wilds' },
                  { value: 'voe', label: 'Visions of Eternity' }
                ].map((expansion) => (
                  <label key={expansion.value} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFarm.expansion.includes(expansion.value as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')}
                      onChange={() => handleExpansionToggle(expansion.value as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-white text-sm">{expansion.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Selecciona todas las expansiones requeridas</p>
            </div>



            {/* Nota explicativa */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mt-4">
              <p className="text-blue-300 text-sm">
                <strong>Recompensas:</strong> Debes especificar al menos una recompensa estimada. Puedes agregar múltiples tipos de monedas según lo que genere el farm. Utiliza el selector para elegir el tipo de moneda y especifica la cantidad por hora.
              </p>
              <p className="text-blue-300 text-sm mt-2">
                <strong>Modalidad:</strong> Marca si el farm se puede hacer solo, si requiere squad, o ambos. El waypoint es opcional pero recomendado para facilitar el acceso.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateFarm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Crear
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Farm Modal */}
      {editingFarm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4">Editar Farm</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={editingFarm.name || ''}
                onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={editingFarm.description || ''}
                onChange={(e) => setEditingFarm({ ...editingFarm, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                rows={3}
                maxLength={DESCRIPTION_MAX}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{(editingFarm.description || '').length}/{DESCRIPTION_MAX}</div>
            </div>

            {/* Waypoint */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Waypoint (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingFarm.waypoint || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, waypoint: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="[&BBAHAAA=]"
                />
                {editingFarm.waypoint && (
                  <button
                    type="button"
                    onClick={() => copyWaypointToClipboard(editingFarm.waypoint!)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Chat code del waypoint para acceder al farm</p>
            </div>

            <RouteCardImageField
              value={editingFarm.locationImageUrl || ''}
              onChange={(url) => setEditingFarm({ ...editingFarm, locationImageUrl: url })}
              token={token}
              farmId={editingFarm.id}
              farmName={editingFarm.name}
            />

            {/* Modalidad del Farm */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Modalidad del Farm
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFarm.isSolo || false}
                    onChange={(e) => setEditingFarm({ ...editingFarm, isSolo: e.target.checked })}
                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-white text-sm">Farm Solitario</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFarm.requiresSquad || false}
                    onChange={(e) => setEditingFarm({ ...editingFarm, requiresSquad: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-white text-sm">Requiere Squad</span>
                </label>
              </div>
            </div>

            {/* Tiempo Estimado */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tiempo Estimado
              </label>
              <input
                type="text"
                value={editingFarm.estimatedTime || ''}
                onChange={(e) => handleTimeChange(e.target.value, true)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="010000 → 01:00:00"
              />
              <p className="text-xs text-gray-400 mt-1">6 dígitos: HHMMSS (ej: 013000 = 01:30:00)</p>
            </div>

            {/* Tipos de Moneda con inputs directos */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tipos de Moneda
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currencyOptions.map((option) => (
                  <div key={option.value} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingSelectedCurrencies.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingSelectedCurrencies(prev => [...prev, option.value]);
                          } else {
                            setEditingSelectedCurrencies(prev => prev.filter(c => c !== option.value));
                            if (editingFarm) {
                              setEditingFarm(prev => ({
                                ...prev!,
                                estimatedRewards: {
                                  ...prev!.estimatedRewards,
                                  [option.value]: ''
                                }
                              }));
                            }
                          }
                        }}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <GW2Icon type={option.icon} size="sm" />
                      <span className="text-white text-sm flex-1 min-w-0">{option.label}</span>
                      <input
                        type={option.value === 'gold' ? 'text' : 'number'}
                        min={option.value === 'gold' ? undefined : '0'}
                        step={option.value === 'gold' ? undefined : '0.01'}
                        value={editingFarm.estimatedRewards?.[option.value as keyof typeof editingFarm.estimatedRewards] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (option.value === 'gold') {
                            const numbersOnly = value.replace(/[^\d]/g, '');
                            if (numbersOnly.length <= 10) {
                              handleEditingCurrencyChange(option.value, numbersOnly);
                            }
                          } else if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            handleEditingCurrencyChange(option.value, value);
                          }
                        }}
                        className="w-24 sm:w-28 md:w-32 lg:w-36 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                        placeholder={option.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Selecciona uno o más tipos de recompensa</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expansiones Requeridas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'core', label: 'Core Game' },
                  { value: 'hot', label: 'Heart of Thorns' },
                  { value: 'pof', label: 'Path of Fire' },
                  { value: 'eod', label: 'End of Dragons' },
                  { value: 'soto', label: 'Secrets of the Obscure' },
                  { value: 'jw', label: 'Janthir Wilds' },
                  { value: 'voe', label: 'Visions of Eternity' }
                ].map((expansion) => (
                  <label key={expansion.value} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(Array.isArray(editingFarm.expansion) ? editingFarm.expansion : [editingFarm.expansion]).includes(expansion.value as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')}
                      onChange={() => handleExpansionToggle(expansion.value as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe', true)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-white text-sm">{expansion.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Selecciona todas las expansiones requeridas</p>
            </div>



            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateFarm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button
                onClick={() => setEditingFarm(null)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Farms List */}
      {isLoading ? (
        <div className="text-center text-gray-400">Cargando farms...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              {/* Información del creador */}
              <div className="mb-3 pb-3 border-b border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    <span>Creado por: {farm.createdByUsername || 'Usuario desconocido'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(farm.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {farm.name}
                  </h3>
                  <div className="p-3 rounded-lg mb-3">
                    <MarkdownText
                      text={farm.description.length > 120 ? `${farm.description.substring(0, 120)}...` : farm.description}
                      className="text-gray-400 text-xs whitespace-pre-wrap break-all"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  {(Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion]).map((exp) => (
                    <ExpansionIcon key={exp} expansion={exp} size="sm" variant="compact" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{farm.estimatedTime}</span>
                </div>

                {/* Mostrar modalidad */}
                <div className="flex gap-2">
                  {farm.isSolo && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Solo
                    </span>
                  )}
                  {farm.requiresSquad && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Squad
                    </span>
                  )}
                </div>
              </div>

              {/* Waypoint */}
              {farm.waypoint && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500">Waypoint:</span>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-blue-400 text-sm">
                    <span className="font-mono">{farm.waypoint}</span>
                    <Copy className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* Recompensas estimadas */}
              <div className="flex items-center gap-4 text-sm mb-3">
                {/* Mostrar estimatedRewards (nuevo sistema) */}
                {farm.estimatedRewards && Object.entries(farm.estimatedRewards).map(([currencyType, value]) => {
                  if (!value || !value.trim()) return null;

                  const currencyConfig = currencyOptions.find(c => c.value === currencyType);
                  if (!currencyConfig) return null;

                  return (
                    <div key={currencyType} className="flex items-center gap-1">
                      <GW2Icon type={currencyConfig.icon} size="sm" />
                      <span className="text-white">{value}</span>
                    </div>
                  );
                })}

                {/* Backward compatibility - mostrar legacy fields si no están duplicados en estimatedRewards */}
                {farm.estimatedGold && farm.estimatedGold.trim() &&
                  (!farm.estimatedRewards || !farm.estimatedRewards.gold || !farm.estimatedRewards.gold.trim()) && (
                    <div className="flex items-center gap-1">
                      <GW2Icon type="gold" size="sm" />
                      <span className="text-yellow-400">{farm.estimatedGold}</span>
                    </div>
                  )}

                {farm.estimatedSpirit && farm.estimatedSpirit.trim() &&
                  (!farm.estimatedRewards || !farm.estimatedRewards.spiritShards || !farm.estimatedRewards.spiritShards.trim()) && (
                    <div className="flex items-center gap-1">
                      <GW2Icon type="spirit-shard" size="sm" />
                      <span className="text-purple-400">{farm.estimatedSpirit}</span>
                    </div>
                  )}
              </div>

              {/* Botones de reordenamiento */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => moveFarmUp(farm.id)}
                  disabled={farms.findIndex(f => f.id === farm.id) === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                  title="Mover hacia arriba"
                >
                  <ChevronUp className="w-4 h-4" />
                  Subir
                </button>
                <button
                  onClick={() => moveFarmDown(farm.id)}
                  disabled={farms.findIndex(f => f.id === farm.id) === farms.length - 1}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                  title="Mover hacia abajo"
                >
                  <ChevronDown className="w-4 h-4" />
                  Bajar
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Asegurar que expansion esté en formato array
                    const farmToEdit = {
                      ...farm,
                      expansion: Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion],
                      estimatedRewards: farm.estimatedRewards || {}
                    };

                    setEditingFarm(farmToEdit);

                    // Configurar monedas seleccionadas basadas en el farm actual
                    const selectedCurrencies = [];
                    if (farmToEdit.estimatedRewards && Object.keys(farmToEdit.estimatedRewards).length > 0) {
                      // Si tiene estimatedRewards, usar esas monedas
                      Object.entries(farmToEdit.estimatedRewards).forEach(([currency, value]) => {
                        if (value && value.trim()) {
                          selectedCurrencies.push(currency);
                        }
                      });
                    } else {
                      // Compatibilidad hacia atrás con campos legacy
                      if (farmToEdit.estimatedGold && farmToEdit.estimatedGold.trim()) {
                        selectedCurrencies.push('gold');
                      }
                      if (farmToEdit.estimatedSpirit && farmToEdit.estimatedSpirit.trim()) {
                        selectedCurrencies.push('spiritShards');
                      }
                    }
                    setEditingSelectedCurrencies(selectedCurrencies.length > 0 ? selectedCurrencies : ['gold']);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPendingFarmsManager = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Farms Pendientes de Aprobación</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {pendingFarms.length} farm{pendingFarms.length !== 1 ? 's' : ''} pendiente{pendingFarms.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleCleanupRejectedFarms}
            className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
            title="Eliminar farms rechazados existentes"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Rechazados
          </button>
        </div>
      </div>

      {/* Farms Pendientes List */}
      {isLoadingPendingFarms ? (
        <div className="text-center text-gray-400">Cargando farms pendientes...</div>
      ) : pendingFarms.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg">No hay farms pendientes de aprobación</p>
          <p className="text-sm text-gray-500">Los moderadores pueden enviar farms que aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingFarms.map((farm) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-yellow-600/50 relative"
            >
              {/* Badge de estado */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Pendiente
                </span>
              </div>

              {/* Información del creador */}
              <div className="mb-3 pb-3 border-b border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    <span>Creado por: {farm.createdByUsername || 'Usuario desconocido'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(farm.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">
                    {farm.name}
                  </h3>
                  <div className="flex gap-1">
                    {(Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion]).map((exp) => (
                      <ExpansionIcon key={exp} expansion={exp} size="sm" variant="compact" />
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg">
                  <p className="text-gray-400 text-xs whitespace-pre-wrap break-all" title={farm.description}>
                    {farm.description.length > 120 ? `${farm.description.substring(0, 120)}...` : farm.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{farm.estimatedTime}</span>
                </div>
                {farm.estimatedGold && farm.estimatedGold.trim() && (
                  <div className="flex items-center gap-1">
                    <Image
                      src="/images/expansions/Gold.webp"
                      alt="Gold"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-yellow-400">{farm.estimatedGold}</span>
                  </div>
                )}
                {farm.estimatedSpirit && farm.estimatedSpirit.trim() && (
                  <div className="flex items-center gap-1">
                    <Image
                      src="/images/expansions/Spirit_Shard.webp"
                      alt="Spirit Shard"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-purple-400">{farm.estimatedSpirit}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveFarm(farm.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleRejectFarm(farm.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUsersManager = () => {
    // Filtrar usuarios basado en la búsqueda
    const filteredUsers = users.filter(user => {
      const searchLower = userSearchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });

    return (
      <div className="space-y-6">
        {/* Header con búsqueda y botón crear */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Buscar por username o email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {!isCreatingUser && (
              <button
                onClick={() => setIsCreatingUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {isCreatingUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Usuario</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="nombre usuario" />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' | 'moderator' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="user">Usuario</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Crear
                </button>
                <button
                  onClick={() => setIsCreatingUser(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4">Editar Usuario</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="nombre usuario" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' | 'moderator' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="user">Usuario</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={editingUser.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Actualizar
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users List */}
        {isLoadingUsers ? (
          <div className="text-center text-gray-400">Cargando usuarios...</div>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="text-sm text-gray-400 mb-4">
              {userSearchQuery ? (
                <span>Mostrando {filteredUsers.length} de {users.length} usuarios</span>
              ) : (
                <span>Total de usuarios: {users.length}</span>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-white">{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'moderator'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {user.role === 'admin' ? 'Administrador' : user.role === 'moderator' ? 'Moderador' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{user.username}</h3>
                      <p className="text-sm text-gray-300">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'moderator'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'moderator' ? 'Moderador' : 'Usuario'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              {user?.role === 'admin' ? 'Panel de Admin' : 'Panel de Moderación'}
            </h1>
            <p className="text-gray-300">
              {user?.role === 'admin'
                ? 'Gestiona los farms y usuarios de la aplicación'
                : 'Gestiona tus farms y revisa contenido pendiente'
              }
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex">
              <button
                onClick={() => setActiveSection('farms')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${activeSection === 'farms'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <Map className="w-5 h-5" />
                Farms
              </button>
              <button
                onClick={() => setActiveSection('users')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${activeSection === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <Users className="w-5 h-5" />
                Usuarios
              </button>
              <button
                onClick={() => setActiveSection('pending-farms')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === 'pending-farms'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                <div className="relative">
                  <Clock className="w-5 h-5" />
                  {pendingFarms.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {pendingFarms.length}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">Pendientes</span>
              </button>

            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'farms' && renderFarmsManager()}
            {activeSection === 'users' && renderUsersManager()}
            {activeSection === 'pending-farms' && renderPendingFarmsManager()}

          </motion.div>
        </div>
      </div>

      {/* Modal de notificaciones */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {modal.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400" />
                )}
                <h3 className="text-lg font-semibold text-white">
                  {modal.title}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-300">
                {modal.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de usuario */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">
                  Confirmar Eliminación
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-300">
                ¿Estás seguro de que quieres eliminar al usuario <span className="font-semibold text-white">&quot;{userToDelete?.username}&quot;</span>?
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Los farms creados por este usuario permanecerán disponibles pero sin información del autor. Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminRoute>
  );
} 