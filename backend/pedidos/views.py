from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .models import Pedido, ArchivoAdjunto
from .serializers import PedidoSerializer, ArchivoAdjuntoSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    password = request.data.get('password', '')
    if password == settings.CRM_PASSWORD:
        # Usamos el usuario admin para generar el token
        from django.contrib.auth.models import User
        user, _ = User.objects.get_or_create(username='crm_admin')
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    from rest_framework_simplejwt.views import TokenRefreshView
    return TokenRefreshView.as_view()(request._request)


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_archivo(request, pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    nombre = request.data.get('nombre', '').strip()
    url = request.data.get('url', '').strip()

    if not nombre or not url:
        return Response({'error': 'Nombre y URL son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    adjunto = ArchivoAdjunto.objects.create(pedido=pedido, nombre=nombre, url=url)
    return Response(ArchivoAdjuntoSerializer(adjunto).data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_archivo(request, archivo_id):
    try:
        adjunto = ArchivoAdjunto.objects.get(id=archivo_id)
        adjunto.archivo.delete()
        adjunto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ArchivoAdjunto.DoesNotExist:
        return Response({'error': 'Archivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)