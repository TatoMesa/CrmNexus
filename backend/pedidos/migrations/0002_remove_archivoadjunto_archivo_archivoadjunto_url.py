from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies = [
        ('pedidos', '0001_initial'),
    ]
    operations = [
        migrations.RemoveField(
            model_name='archivoadjunto',
            name='archivo',
        ),
        migrations.AddField(
            model_name='archivoadjunto',
            name='url',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
    ]